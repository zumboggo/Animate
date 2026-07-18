import { settings } from '../../engine/settings';
import type {
  CastEntry,
  CharacterAction,
  CharacterEmotion,
  CharacterPose,
  Gait,
} from '../../engine/storyTypes';
import { sleep } from '../../engine/timing';
import type {
  ActingMotion,
  AnimationOptions,
  PoseTransitionOptions,
} from '../animationTypes';
import { BaseAdapter, warnOnce } from './baseAdapter';

const POSE_TRANSFORMS: Record<CharacterPose, string> = {
  idle: 'translate(0, 0) rotate(0deg)',
  talkNeutral: 'translate(1px, -1px) rotate(-0.35deg)',
  talkHappy: 'translate(1px, -2px) rotate(-0.6deg)',
  talkAngry: 'translate(0, 0) rotate(0.45deg)',
  scared: 'translate(-4px, 2px) rotate(-0.7deg)',
  laugh: 'translate(0, 1px) rotate(-0.65deg)',
  sit: 'translate(0, 12px) rotate(0deg)',
  point: 'translate(2px, 0) rotate(-0.45deg)',
  handsOnHips: 'translate(0, 0) rotate(0.4deg)',
  surprised: 'translate(0, -3px) rotate(0.25deg)',
  fall: 'translate(12px, 24px) rotate(8deg)',
  dance: 'translate(-2px, -2px) rotate(-0.8deg)',
};

/**
 * Pose-first implementation of the puppetParts contract.
 *
 * Sarah currently has one coherent full-body pose set, while the supplied
 * separated parts use a different outfit.  This adapter therefore keeps the
 * requested nested transform layers and manifest contract, crossfades whole-
 * body poses for difficult acting, and uses restrained story-app motion for
 * everything else.  Matching layered parts can be added without changing the
 * director or .story syntax.
 */
export class PuppetPartsAdapter extends BaseAdapter {
  private scaleLayer: HTMLDivElement | null = null;
  private animationLayer: HTMLDivElement | null = null;
  private puppet: HTMLDivElement | null = null;
  private activeSprite: HTMLImageElement | null = null;
  private standbySprite: HTMLImageElement | null = null;
  private currentEmotion: CharacterEmotion = 'neutral';
  private currentPose: CharacterPose = 'idle';
  private currentAsset = '';
  private swapVersion = 0;

  constructor(private entry: CastEntry) {
    super();
  }

  protected buildContent(inner: HTMLElement): void {
    inner.classList.add('puppet-parts-host');

    this.scaleLayer = document.createElement('div');
    this.scaleLayer.className = 'puppet-scale-layer';
    this.scaleLayer.style.height = `${((this.entry.scale ?? this.entry.appearance?.height ?? 1) * 100).toFixed(1)}%`;

    this.animationLayer = document.createElement('div');
    this.animationLayer.className = 'puppet-animation-layer';
    this.puppet = document.createElement('div');
    this.puppet.className = 'puppet puppet-pose-first';
    this.puppet.dataset.animation = 'idle';

    this.activeSprite = this.makeSprite('is-active');
    this.standbySprite = this.makeSprite('');
    this.puppet.append(this.activeSprite, this.standbySprite, this.makeDebugOverlay());
    this.animationLayer.appendChild(this.puppet);
    this.scaleLayer.appendChild(this.animationLayer);
    inner.appendChild(this.scaleLayer);

    const initial = this.entry.asset ?? this.entry.poseAssets?.idle;
    if (initial) {
      this.currentAsset = initial;
      this.activeSprite.src = initial;
      this.applyPoseScale(this.activeSprite, 'idle');
    } else {
      warnOnce(
        `puppet-asset-${this.entry.displayName}`,
        `${this.entry.displayName} has no puppet base asset; the actor will remain hidden.`,
      );
      this.activeSprite.hidden = true;
    }
    this.startIdle();
  }

  unmount(): void {
    this.swapVersion += 1;
    this.scaleLayer = null;
    this.animationLayer = null;
    this.puppet = null;
    this.activeSprite = null;
    this.standbySprite = null;
    super.unmount();
  }

  async setEmotion(emotion: CharacterEmotion): Promise<void> {
    this.currentEmotion = emotion;
  }

  async transitionToPose(pose: CharacterPose, options: PoseTransitionOptions = {}): Promise<boolean> {
    if (!this.puppet || !this.animationLayer) return false;
    this.currentPose = pose;
    this.setDebugAnimation(pose);

    const source = this.resolveAsset(pose);
    const swapped = source ? await this.swapTo(source, pose) : false;
    if (!swapped && !this.currentAsset) return false;

    const durationMs = options.durationMs ?? 300;
    this.puppet.style.transitionDuration = `${durationMs}ms`;
    this.puppet.style.transform = POSE_TRANSFORMS[pose];
    await this.playWholeBodyMotion(options.motion ?? 'settle');
    if (pose === 'idle') this.startIdle();
    else this.stopIdle();
    return true;
  }

  async playAction(action: CharacterAction, _options?: AnimationOptions): Promise<void> {
    if (!this.animationLayer || !this.puppet) return;
    if (action === 'idle' || action === 'stand') {
      await this.transitionToPose('idle', { durationMs: 280, motion: 'settle' });
      return;
    }
    if (action === 'turnAround') {
      await this.turnAround();
      return;
    }
    if (settings.reduceMotion) {
      await sleep(180);
      return;
    }

    const motions: Partial<Record<CharacterAction, { frames: Keyframe[]; ms: number; loops?: number }>> = {
      nod: {
        frames: [{ transform: 'translateY(0)' }, { transform: 'translateY(4px) scaleY(.99)' }, { transform: 'translateY(0)' }],
        ms: 520,
      },
      shakeHead: {
        frames: [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }],
        ms: 420,
      },
      wave: {
        frames: [{ transform: 'rotate(0)' }, { transform: 'rotate(-1.2deg)' }, { transform: 'rotate(.8deg)' }, { transform: 'rotate(0)' }],
        ms: 620,
      },
      jump: {
        frames: [{ transform: 'translateY(0)' }, { transform: 'translateY(-28px)' }, { transform: 'translateY(2px)' }, { transform: 'translateY(0)' }],
        ms: 650,
      },
      bounce: {
        frames: [{ transform: 'translateY(0)' }, { transform: 'translateY(-8px)' }, { transform: 'translateY(0)' }],
        ms: 420,
      },
      recoil: {
        frames: [{ transform: 'translateX(0) scale(1)' }, { transform: 'translateX(-8px) scale(.985)' }, { transform: 'translateX(1px) scale(1)' }],
        ms: 360,
      },
      tremble: {
        frames: [{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }],
        ms: 150,
        loops: 5,
      },
      cry: {
        frames: [{ transform: 'translateY(0)' }, { transform: 'translateY(3px) rotate(-.5deg)' }, { transform: 'translateY(0)' }],
        ms: 600,
        loops: 2,
      },
      treePose: {
        frames: [{ transform: 'rotate(0)' }, { transform: 'rotate(-.8deg)' }, { transform: 'rotate(.5deg)' }, { transform: 'rotate(0)' }],
        ms: 900,
      },
    };
    const motion = motions[action];
    if (!motion) {
      warnOnce(
        `puppet-action-${this.entry.displayName}-${action}`,
        `${this.entry.displayName} has no clean ${action} pose yet; using a gentle settle.`,
      );
      await this.playWholeBodyMotion('settle');
      return;
    }
    this.setDebugAnimation(action);
    await this.animationLayer.animate(motion.frames, {
      duration: motion.ms,
      iterations: motion.loops ?? 1,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    }).finished.catch(() => undefined);
  }

  startIdle(): void {
    this.animationLayer?.classList.add('is-idle');
  }

  stopIdle(): void {
    this.animationLayer?.classList.remove('is-idle');
  }

  startTalking(): void {
    this.animationLayer?.classList.add('is-talking');
  }

  stopTalking(): void {
    this.animationLayer?.classList.remove('is-talking');
  }

  protected onMoveStart(gait: Gait): void {
    this.stopIdle();
    this.setDebugAnimation(gait === 'run' ? 'run' : 'walk');
    this.animationLayer?.classList.add(gait === 'run' ? 'is-running' : 'is-walking');
  }

  protected onMoveEnd(): void {
    this.animationLayer?.classList.remove('is-walking', 'is-running');
    this.setDebugAnimation(this.currentPose);
    this.startIdle();
  }

  private makeSprite(extraClass: string): HTMLImageElement {
    const image = document.createElement('img');
    image.className = `puppet-pose-sprite ${extraClass}`.trim();
    image.alt = this.entry.displayName;
    image.draggable = false;
    return image;
  }

  private resolveAsset(pose: CharacterPose): string | undefined {
    const emotional = this.entry.emotionAssets?.[this.currentEmotion];
    if ((pose === 'idle' || pose === 'talkNeutral') && this.currentEmotion !== 'neutral' && emotional) {
      return emotional;
    }
    return this.entry.poseAssets?.[pose]
      ?? emotional
      ?? (pose === 'idle' ? this.entry.asset : undefined)
      ?? this.entry.asset;
  }

  private async swapTo(source: string, pose: CharacterPose): Promise<boolean> {
    if (!this.activeSprite || !this.standbySprite) return false;
    if (source === this.currentAsset) {
      this.applyPoseScale(this.activeSprite, pose);
      return true;
    }
    const version = ++this.swapVersion;
    const incoming = this.standbySprite;
    incoming.src = source;
    this.applyPoseScale(incoming, pose);
    try {
      await incoming.decode();
    } catch {
      warnOnce(
        `puppet-pose-${this.entry.displayName}-${pose}`,
        `${this.entry.displayName}'s ${pose} sprite could not load; keeping the previous clean pose.`,
      );
      return false;
    }
    if (version !== this.swapVersion || !this.activeSprite || !this.standbySprite) return false;
    incoming.classList.add('is-active');
    this.activeSprite.classList.remove('is-active');
    await sleep(settings.reduceMotion ? 40 : 170);
    const outgoing = this.activeSprite;
    this.activeSprite = incoming;
    this.standbySprite = outgoing;
    this.currentAsset = source;
    return true;
  }

  private applyPoseScale(image: HTMLImageElement, pose: CharacterPose): void {
    const scale = this.entry.poseScales?.[pose] ?? 1;
    image.style.height = `${(scale * 100).toFixed(1)}%`;
  }

  private async playWholeBodyMotion(motion: ActingMotion): Promise<void> {
    if (!this.animationLayer || motion === 'none' || motion === 'talk') return;
    if (settings.reduceMotion) {
      await sleep(100);
      return;
    }
    const specs: Partial<Record<ActingMotion, { frames: Keyframe[]; ms: number }>> = {
      settle: {
        frames: [{ transform: 'translateY(2px)' }, { transform: 'translateY(-1px)' }, { transform: 'translateY(0)' }],
        ms: 260,
      },
      laugh: {
        frames: [{ transform: 'translateY(0)' }, { transform: 'translateY(4px)' }, { transform: 'translateY(-2px)' }, { transform: 'translateY(0)' }],
        ms: 720,
      },
      recoil: {
        frames: [{ transform: 'translateX(0) scale(1)' }, { transform: 'translateX(-8px) scale(.985)' }, { transform: 'translateX(1px) scale(1)' }],
        ms: 360,
      },
      dance: {
        frames: [{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(-4px,-3px) rotate(-1.5deg)' }, { transform: 'translate(4px,0) rotate(1.5deg)' }, { transform: 'translate(0,0) rotate(0)' }],
        ms: 980,
      },
    };
    const spec = specs[motion];
    if (!spec) return;
    await this.animationLayer.animate(spec.frames, {
      duration: spec.ms,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    }).finished.catch(() => undefined);
  }

  private async turnAround(): Promise<void> {
    if (!this.inner) return;
    const next = this.facing === 'left' ? 'right' : 'left';
    this.inner.style.transition = 'transform 180ms ease-in';
    this.inner.style.transform = 'scaleX(0)';
    await sleep(180);
    this.setFacing(next);
    this.inner.style.transition = 'transform 200ms ease-out';
    this.inner.style.transform = next === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
    await sleep(200);
    this.inner.style.transition = '';
  }

  private makeDebugOverlay(): HTMLDivElement {
    const debug = document.createElement('div');
    debug.className = 'puppet-debug-overlay';
    debug.setAttribute('aria-hidden', 'true');
    debug.innerHTML = `
      <span class="puppet-debug-name">${this.entry.displayName} · poseSprites</span>
      <span class="puppet-debug-animation">idle</span>
      <i class="puppet-debug-pivot pivot-left-shoulder" data-label="left shoulder"></i>
      <i class="puppet-debug-pivot pivot-right-shoulder" data-label="right shoulder"></i>
      <i class="puppet-debug-pivot pivot-left-hip" data-label="left hip"></i>
      <i class="puppet-debug-pivot pivot-right-hip" data-label="right hip"></i>
      <span class="puppet-debug-layers">hair-back · back-arm · legs · pelvis · torso · front-arm · head · face · hair-front</span>
    `;
    return debug;
  }

  private setDebugAnimation(name: string): void {
    if (this.puppet) this.puppet.dataset.animation = name;
    const label = this.puppet?.querySelector<HTMLElement>('.puppet-debug-animation');
    if (label) label.textContent = name;
  }
}
