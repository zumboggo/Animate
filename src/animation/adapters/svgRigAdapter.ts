import { settings } from '../../engine/settings';
import type {
  CastEntry,
  CharacterAction,
  CharacterEmotion,
  CharacterPose,
  Gait,
} from '../../engine/storyTypes';
import { sleep } from '../../engine/timing';
import { CLIPS } from '../../rig/clips';
import { buildRigCharacter, type RigCharacter } from '../../rig/svgCharacter';
import { SvgAnimator } from '../../rig/svgAnimator';
import { BONE_DEFS } from '../../rig/svgSkeleton';
import { RIG_POSES } from '../../rig/poseTemplates';
import type { AnimationOptions, ActingMotion, PoseTransitionOptions } from '../animationTypes';
import { BaseAdapter, warnOnce } from './baseAdapter';

interface ClipSpec {
  clip: string;
  loops?: number;
  rate?: number;
  /** Skipped (short pause instead) when reduced motion is on. */
  energetic?: boolean;
}

const ACTION_CLIPS: Partial<Record<CharacterAction, ClipSpec>> = {
  nod: { clip: 'nod' },
  shakeHead: { clip: 'shakeHead' },
  wave: { clip: 'wave' },
  jump: { clip: 'jump', energetic: true },
  bounce: { clip: 'bounce' },
  recoil: { clip: 'recoil' },
  tremble: { clip: 'tremble', loops: 8, energetic: true },
  actScared: { clip: 'tremble', loops: 8, energetic: true },
  treePose: { clip: 'treePose' },
  sit: { clip: 'sit' },
  laugh: { clip: 'laugh' },
  cry: { clip: 'cry' },
  point: { clip: 'point' },
  dance: { clip: 'dance', loops: 2, energetic: true },
  fall: { clip: 'fall', energetic: true },
};

/** The built-in code-rigged vector character. */
export class SvgRigAdapter extends BaseAdapter {
  private rig: RigCharacter | null = null;
  private animator: SvgAnimator | null = null;
  private idling = false;
  private presentation: HTMLDivElement | null = null;
  private motionLayer: HTMLDivElement | null = null;
  private poseSprite: HTMLImageElement | null = null;

  constructor(private entry: CastEntry) {
    super();
  }

  protected buildContent(inner: HTMLElement): void {
    this.rig = buildRigCharacter(this.entry.appearance);
    this.rig.svg.style.height = `${(this.rig.appearance.height * 100).toFixed(1)}%`;
    this.rig.svg.classList.add('actor-rig-art');

    this.presentation = document.createElement('div');
    this.presentation.className = 'actor-presentation';
    this.presentation.style.transform = RIG_POSES.idle.presentation;
    this.motionLayer = document.createElement('div');
    this.motionLayer.className = 'actor-motion-layer';
    this.poseSprite = document.createElement('img');
    this.poseSprite.className = 'actor-pose-sprite';
    this.poseSprite.alt = this.entry.displayName;
    this.poseSprite.hidden = true;
    this.motionLayer.append(this.rig.svg, this.poseSprite);
    this.presentation.appendChild(this.motionLayer);
    inner.appendChild(this.presentation);

    const pivots = new Map(BONE_DEFS.map((b) => [b.name, { px: b.pivotX, py: b.pivotY }]));
    this.animator = new SvgAnimator(this.rig.bones, pivots);
    this.rig.face.startBlinking();
    this.startIdle();
  }

  unmount(): void {
    this.rig?.face.dispose();
    this.animator?.dispose();
    this.rig = null;
    this.animator = null;
    this.presentation = null;
    this.motionLayer = null;
    this.poseSprite = null;
    super.unmount();
  }

  async setEmotion(emotion: CharacterEmotion): Promise<void> {
    this.rig?.face.setEmotion(emotion);
  }

  async playAction(action: CharacterAction, _options?: AnimationOptions): Promise<void> {
    if (!this.animator) return;

    if (action === 'idle') {
      this.startIdle();
      return;
    }
    if (action === 'stand') {
      await this.transitionToPose('idle', { durationMs: 380, motion: 'settle' });
      return;
    }
    if (action === 'turnAround') {
      await this.turnAround();
      return;
    }

    let spec = ACTION_CLIPS[action];
    if (!spec) {
      warnOnce(`action-${action}`, `The SVG rig has no "${action}" animation yet — settling into a clean idle pose.`);
      await this.transitionToPose('idle', { durationMs: 280, motion: 'settle' });
      return;
    }

    if (spec.energetic && settings.reduceMotion) {
      await sleep(300);
      return;
    }

    this.stopIdle();
    if (action === 'cry') this.rig?.face.setTears(true);
    await this.animator.play(CLIPS[spec.clip], { loops: spec.loops, rate: spec.rate });
    if (action === 'cry') this.rig?.face.setTears(false);

    if (!CLIPS[spec.clip].holdEnd) {
      // Clips like tremble end mid-pose; ease back to rest before idling.
      await this.animator.toRest(200);
      this.startIdle();
    }
  }

  async transitionToPose(pose: CharacterPose, options: PoseTransitionOptions = {}): Promise<boolean> {
    if (!this.animator || !this.presentation) return false;
    const template = RIG_POSES[pose];
    if (!template) return false;

    this.stopIdle();
    const durationMs = options.durationMs ?? 300;
    const usingSprite = options.preferSprite ? this.showPoseSprite(pose) : false;
    if (!usingSprite) this.hidePoseSprite();

    this.presentation.style.transitionDuration = `${durationMs}ms`;
    this.presentation.style.transform = template.presentation;
    await this.animator.toPose(template.bones, durationMs, pose);
    await this.playWholeBodyMotion(options.motion ?? template.motion ?? 'none');

    if (pose === 'idle') this.startIdle();
    return true;
  }

  startIdle(): void {
    if (this.idling || !this.animator || settings.reduceMotion) return;
    this.idling = true;
    void this.animator.play(CLIPS.idle);
  }

  stopIdle(): void {
    if (!this.idling || !this.animator) return;
    this.idling = false;
    this.animator.stop();
  }

  startTalking(): void {
    this.rig?.face.startTalking();
    this.motionLayer?.classList.add('is-talking');
  }

  stopTalking(): void {
    this.rig?.face.stopTalking();
    this.motionLayer?.classList.remove('is-talking');
  }

  protected onMoveStart(gait: Gait): void {
    if (!this.animator) return;
    this.stopIdle();
    this.hidePoseSprite();
    if (this.presentation) this.presentation.style.transform = RIG_POSES.idle.presentation;
    void this.animator.play(CLIPS.walk, { rate: gait === 'run' ? 1.9 : 1 });
  }

  protected onMoveEnd(): void {
    if (!this.animator) return;
    this.animator.stop();
    void this.animator.toPose(RIG_POSES.idle.bones, 240, 'walk-settle').then(() => this.startIdle());
  }

  private showPoseSprite(pose: CharacterPose): boolean {
    const source = this.entry.poseAssets?.[pose];
    if (!source || !this.poseSprite || !this.motionLayer) return false;
    this.poseSprite.src = source;
    this.poseSprite.hidden = false;
    this.motionLayer.classList.add('special-pose-active');
    this.poseSprite.onerror = () => this.hidePoseSprite();
    return true;
  }

  private hidePoseSprite(): void {
    if (this.poseSprite) this.poseSprite.hidden = true;
    this.motionLayer?.classList.remove('special-pose-active');
  }

  private async playWholeBodyMotion(motion: ActingMotion): Promise<void> {
    if (!this.motionLayer || motion === 'none' || motion === 'talk') return;
    if (settings.reduceMotion) {
      await sleep(140);
      return;
    }
    const specs: Partial<Record<ActingMotion, { frames: Keyframe[]; ms: number }>> = {
      settle: {
        frames: [
          { transform: 'translateY(2px)' },
          { transform: 'translateY(-1px)' },
          { transform: 'translateY(0)' },
        ],
        ms: 260,
      },
      laugh: {
        frames: [
          { transform: 'translateY(0) rotate(0)' },
          { transform: 'translateY(3px) rotate(-1.5deg)' },
          { transform: 'translateY(0) rotate(1deg)' },
          { transform: 'translateY(3px) rotate(-1deg)' },
          { transform: 'translateY(0) rotate(0)' },
        ],
        ms: 760,
      },
      recoil: {
        frames: [
          { transform: 'translateX(0) scale(1)' },
          { transform: 'translateX(-9px) scale(0.985)' },
          { transform: 'translateX(2px) scale(1.005)' },
          { transform: 'translateX(0) scale(1)' },
        ],
        ms: 360,
      },
      dance: {
        frames: [
          { transform: 'translate(0, 0) rotate(0)' },
          { transform: 'translate(-5px, -3px) rotate(-2deg)' },
          { transform: 'translate(5px, 0) rotate(2deg)' },
          { transform: 'translate(-3px, -2px) rotate(-1deg)' },
          { transform: 'translate(0, 0) rotate(0)' },
        ],
        ms: 1100,
      },
    };
    const spec = specs[motion];
    if (!spec) return;
    await this.motionLayer.animate(spec.frames, {
      duration: spec.ms,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    }).finished.catch(() => undefined);
  }

  private async turnAround(): Promise<void> {
    if (!this.inner) return;
    const flipTo = this.facing === 'left' ? 'right' : 'left';
    this.inner.style.transition = 'transform 0.2s ease-in';
    this.inner.style.transform = 'scaleX(0)';
    await sleep(200);
    this.setFacing(flipTo);
    this.inner.style.transition = 'transform 0.2s ease-out';
    this.inner.style.transform = flipTo === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
    await sleep(220);
    this.inner.style.transition = '';
  }
}
