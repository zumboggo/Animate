export interface BoneFrame {
  rotate?: number;
  tx?: number;
  ty?: number;
}

export interface ClipKeyframe {
  /** Normalized 0..1 within the clip. */
  time: number;
  bones: Record<string, BoneFrame>;
}

export interface Clip {
  name: string;
  durationMs: number;
  loop?: boolean;
  /** Keep the final pose after the clip ends (e.g. sitting). */
  holdEnd?: boolean;
  keyframes: ClipKeyframe[];
}

export interface PlayOptions {
  rate?: number;
  /** Repeat count for looping clips. Omit for a loop that runs until stop(). */
  loops?: number;
  /** How long to blend from the current pose into the clip. */
  blendMs?: number;
}

interface Track {
  times: number[];
  frames: Required<BoneFrame>[];
}

type Pose = Record<string, Required<BoneFrame>>;

const ZERO: Required<BoneFrame> = { rotate: 0, tx: 0, ty: 0 };

/**
 * Plays JSON keyframe clips on a character's bone <g> elements.
 * One animator per character; a new play() call takes over from the last.
 */
export class SvgAnimator {
  private pose: Pose = {};
  private raf = 0;
  private token = 0;
  private resolveCurrent: (() => void) | null = null;

  constructor(private bones: Map<string, SVGGElement>, private pivots: Map<string, { px: number; py: number }>) {}

  play(clip: Clip, opts: PlayOptions = {}): Promise<void> {
    this.finishCurrent();
    const token = ++this.token;

    const rate = opts.rate ?? 1;
    const duration = clip.durationMs / rate;
    const loops = opts.loops ?? (clip.loop ? Infinity : 1);
    const blendMs = opts.blendMs ?? 130;

    const tracks = this.buildTracks(clip);
    const startPose: Pose = {};
    for (const bone of tracks.keys()) startPose[bone] = this.pose[bone] ?? { ...ZERO };

    return new Promise<void>((resolve) => {
      this.resolveCurrent = resolve;
      const start = performance.now();

      const frame = (now: number) => {
        if (token !== this.token) return;
        const elapsed = now - start;
        const finished = elapsed >= duration * loops;
        const cycleT = finished ? 1 : (elapsed % duration) / duration;
        const blendProgress = blendMs > 0 ? Math.min(1, elapsed / blendMs) : 1;
        const blend = smoothstep(blendProgress);

        for (const [bone, track] of tracks) {
          const target = evalTrack(track, cycleT);
          const from = startPose[bone];
          this.applyBone(bone, {
            rotate: lerp(from.rotate, target.rotate, blend),
            tx: lerp(from.tx, target.tx, blend),
            ty: lerp(from.ty, target.ty, blend),
          });
        }

        if (finished) {
          this.finishCurrent();
          return;
        }
        this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    });
  }

  /** Stops the current clip (resolving its promise) and keeps the pose. */
  stop(): void {
    this.token++;
    this.finishCurrent();
  }

  /** Eases every posed bone back to the rest pose. */
  toRest(ms = 320): Promise<void> {
    return this.toPose({}, ms, 'rest');
  }

  /** Smoothly blends from the current skeleton state to a reusable named-pose template. */
  toPose(target: Record<string, BoneFrame>, ms = 320, name = 'pose'): Promise<void> {
    const bones: Record<string, BoneFrame> = {};
    const names = new Set([...Object.keys(this.pose), ...Object.keys(target)]);
    for (const bone of names) bones[bone] = target[bone] ?? {};
    if (names.size === 0) return Promise.resolve();
    return this.play(
      {
        name,
        durationMs: ms,
        keyframes: [
          { time: 0, bones },
          { time: 1, bones },
        ],
      },
      { blendMs: ms },
    );
  }

  getPose(bone: string): Required<BoneFrame> {
    return this.pose[bone] ?? { ...ZERO };
  }

  dispose(): void {
    this.token++;
    this.finishCurrent();
  }

  private finishCurrent(): void {
    cancelAnimationFrame(this.raf);
    const resolve = this.resolveCurrent;
    this.resolveCurrent = null;
    resolve?.();
  }

  private buildTracks(clip: Clip): Map<string, Track> {
    const tracks = new Map<string, Track>();
    for (const kf of clip.keyframes) {
      for (const bone of Object.keys(kf.bones)) {
        if (!tracks.has(bone)) tracks.set(bone, { times: [], frames: [] });
      }
    }
    for (const [bone, track] of tracks) {
      for (const kf of clip.keyframes) {
        const frame = kf.bones[bone];
        if (frame) {
          track.times.push(kf.time);
          track.frames.push({ rotate: frame.rotate ?? 0, tx: frame.tx ?? 0, ty: frame.ty ?? 0 });
        }
      }
    }
    return tracks;
  }

  private applyBone(bone: string, frame: Required<BoneFrame>): void {
    const g = this.bones.get(bone);
    const pivot = this.pivots.get(bone);
    if (!g || !pivot) return;
    this.pose[bone] = frame;
    g.setAttribute(
      'transform',
      `translate(${frame.tx.toFixed(2)} ${frame.ty.toFixed(2)}) ` +
        `rotate(${frame.rotate.toFixed(2)} ${pivot.px} ${pivot.py})`,
    );
  }
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function evalTrack(track: Track, t: number): Required<BoneFrame> {
  const { times, frames } = track;
  if (t <= times[0]) return frames[0];
  const last = times.length - 1;
  if (t >= times[last]) return frames[last];
  let i = 0;
  while (t > times[i + 1]) i++;
  const span = times[i + 1] - times[i];
  const u = span === 0 ? 1 : (t - times[i]) / span;
  const s = smoothstep(u);
  return {
    rotate: lerp(frames[i].rotate, frames[i + 1].rotate, s),
    tx: lerp(frames[i].tx, frames[i + 1].tx, s),
    ty: lerp(frames[i].ty, frames[i + 1].ty, s),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
