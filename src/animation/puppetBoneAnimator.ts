import type { BoneFrame, Clip, PlayOptions } from '../rig/svgAnimator';

interface Track {
  times: number[];
  frames: Required<BoneFrame>[];
}

type Pose = Record<string, Required<BoneFrame>>;

const ZERO: Required<BoneFrame> = { rotate: 0, tx: 0, ty: 0 };

/** Keyframe animator for nested HTML puppet bones. */
export class PuppetBoneAnimator {
  private pose: Pose = {};
  private raf = 0;
  private token = 0;
  private resolveCurrent: (() => void) | null = null;

  constructor(
    private bones: Map<string, HTMLElement>,
    private rotationScale = 0.72,
  ) {}

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
        const blend = smoothstep(blendMs > 0 ? Math.min(1, elapsed / blendMs) : 1);

        for (const [bone, track] of tracks) {
          const target = evalTrack(track, cycleT);
          const from = startPose[bone];
          this.applyBone(bone, {
            rotate: lerp(from.rotate, target.rotate, blend),
            tx: lerp(from.tx, target.tx, blend),
            ty: lerp(from.ty, target.ty, blend),
          });
        }
        if (finished) this.finishCurrent();
        else this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    });
  }

  stop(): void {
    this.token += 1;
    this.finishCurrent();
  }

  toRest(ms = 280): Promise<void> {
    return this.toPose({}, ms, 'rest');
  }

  toPose(target: Record<string, BoneFrame>, ms = 280, name = 'pose'): Promise<void> {
    const frames: Record<string, BoneFrame> = {};
    const names = new Set([...Object.keys(this.pose), ...Object.keys(target)]);
    for (const bone of names) frames[bone] = target[bone] ?? {};
    if (!names.size) return Promise.resolve();
    return this.play({
      name,
      durationMs: ms,
      keyframes: [{ time: 0, bones: frames }, { time: 1, bones: frames }],
    }, { blendMs: ms });
  }

  dispose(): void {
    this.token += 1;
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
    for (const keyframe of clip.keyframes) {
      for (const bone of Object.keys(keyframe.bones)) {
        if (!tracks.has(bone)) tracks.set(bone, { times: [], frames: [] });
      }
    }
    for (const [bone, track] of tracks) {
      for (const keyframe of clip.keyframes) {
        const value = keyframe.bones[bone];
        if (!value) continue;
        track.times.push(keyframe.time);
        track.frames.push({
          rotate: value.rotate ?? 0,
          tx: value.tx ?? 0,
          ty: value.ty ?? 0,
        });
      }
    }
    return tracks;
  }

  private applyBone(name: string, frame: Required<BoneFrame>): void {
    const bone = this.bones.get(name);
    if (!bone) return;
    this.pose[name] = frame;
    const rotation = frame.rotate * this.rotationScale;
    bone.style.transform = `translate(${frame.tx.toFixed(2)}px, ${frame.ty.toFixed(2)}px) rotate(${rotation.toFixed(2)}deg)`;
  }
}

function smoothstep(value: number): number {
  // Quintic smoothstep has zero velocity and acceleration at both ends.  The
  // gentler settle is especially visible on the simplified elbow/knee rig.
  return value * value * value * (value * (value * 6 - 15) + 10);
}

function evalTrack(track: Track, value: number): Required<BoneFrame> {
  if (value <= track.times[0]) return track.frames[0];
  const last = track.times.length - 1;
  if (value >= track.times[last]) return track.frames[last];
  let index = 0;
  while (value > track.times[index + 1]) index += 1;
  const span = track.times[index + 1] - track.times[index];
  const t = smoothstep(span === 0 ? 1 : (value - track.times[index]) / span);
  return {
    rotate: lerp(track.frames[index].rotate, track.frames[index + 1].rotate, t),
    tx: lerp(track.frames[index].tx, track.frames[index + 1].tx, t),
    ty: lerp(track.frames[index].ty, track.frames[index + 1].ty, t),
  };
}

function lerp(from: number, to: number, value: number): number {
  return from + (to - from) * value;
}
