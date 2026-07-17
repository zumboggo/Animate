import { settings } from '../../engine/settings';
import type {
  CastEntry,
  CharacterAction,
  CharacterEmotion,
  Gait,
} from '../../engine/storyTypes';
import { sleep } from '../../engine/timing';
import { CLIPS } from '../../rig/clips';
import { buildRigCharacter, type RigCharacter } from '../../rig/svgCharacter';
import { SvgAnimator } from '../../rig/svgAnimator';
import { BONE_DEFS } from '../../rig/svgSkeleton';
import type { AnimationOptions } from '../animationTypes';
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
  tremble: { clip: 'tremble', loops: 8, energetic: true },
  actScared: { clip: 'tremble', loops: 8, energetic: true },
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

  constructor(private entry: CastEntry) {
    super();
  }

  protected buildContent(inner: HTMLElement): void {
    this.rig = buildRigCharacter(this.entry.appearance);
    this.rig.svg.style.height = `${(this.rig.appearance.height * 100).toFixed(1)}%`;
    inner.appendChild(this.rig.svg);

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
      this.stopIdle();
      await this.animator.toRest(380);
      this.startIdle();
      return;
    }
    if (action === 'turnAround') {
      await this.turnAround();
      return;
    }

    let spec = ACTION_CLIPS[action];
    if (!spec) {
      warnOnce(`action-${action}`, `The SVG rig has no "${action}" animation yet — using a bounce instead.`);
      spec = { clip: 'bounce' };
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
  }

  stopTalking(): void {
    this.rig?.face.stopTalking();
  }

  protected onMoveStart(gait: Gait): void {
    if (!this.animator) return;
    this.stopIdle();
    void this.animator.play(CLIPS.walk, { rate: gait === 'run' ? 1.9 : 1 });
  }

  protected onMoveEnd(): void {
    if (!this.animator) return;
    this.animator.stop();
    void this.animator.toRest(220).then(() => this.startIdle());
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
