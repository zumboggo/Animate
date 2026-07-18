import type { CastEntry, CharacterAction, CharacterEmotion, CharacterPose } from '../../engine/storyTypes';
import { settings } from '../../engine/settings';
import { sleep } from '../../engine/timing';
import type { AnimationOptions, PoseTransitionOptions } from '../animationTypes';
import { BaseAdapter, warnOnce } from './baseAdapter';

/**
 * Simplest possible adapter: one full-body image (or a built-in placeholder
 * blob) animated with CSS/Web Animations. Emotions fall back to neutral.
 * Useful as a graceful fallback and as the base for future asset adapters.
 */
export class StaticSpriteAdapter extends BaseAdapter {
  protected content: HTMLElement | SVGSVGElement | null = null;
  private baseAsset = '';

  constructor(protected entry: CastEntry) {
    super();
  }

  protected buildContent(inner: HTMLElement): void {
    if (this.entry.asset) {
      const img = document.createElement('img');
      img.src = this.entry.asset;
      this.baseAsset = this.entry.asset;
      img.alt = this.entry.displayName;
      inner.appendChild(img);
      this.content = img;
    } else {
      inner.insertAdjacentHTML(
        'beforeend',
        `<svg viewBox="0 0 200 330" preserveAspectRatio="xMidYMax meet">
          <ellipse cx="100" cy="200" rx="62" ry="115" fill="${this.entry.appearance?.shirtColor ?? '#8d8fb5'}"/>
          <circle cx="78" cy="150" r="9" fill="#26201d"/>
          <circle cx="122" cy="150" r="9" fill="#26201d"/>
          <path d="M82,190 Q100,205 118,190" fill="none" stroke="#26201d" stroke-width="5" stroke-linecap="round"/>
        </svg>`,
      );
      this.content = inner.querySelector('svg');
    }
  }

  async transitionToPose(pose: CharacterPose, options: PoseTransitionOptions = {}): Promise<boolean> {
    if (!this.content) return false;
    const poseAsset = this.entry.poseAssets?.[pose];
    if (this.content instanceof HTMLImageElement) {
      const nextAsset = poseAsset ?? (pose === 'idle' ? this.baseAsset : '');
      if (nextAsset && this.content.src !== nextAsset) this.content.src = nextAsset;
    }

    const transforms: Record<CharacterPose, string> = {
      idle: 'translate(0, 0) rotate(-0.8deg) scaleX(0.97)',
      talkNeutral: 'translate(2px, 0) rotate(-1.2deg) scaleX(0.97)',
      talkHappy: 'translate(2px, -2px) rotate(-2deg) scaleX(0.97)',
      talkAngry: 'translate(1px, 0) rotate(1.2deg) scaleX(0.98)',
      scared: 'translate(-8px, 0) rotate(-2deg) scale(0.98)',
      laugh: 'translate(0, 2px) rotate(-2deg) scaleX(0.98)',
      sit: 'translate(0, 36px) rotate(0) scaleY(0.96)',
      point: 'translate(2px, 0) rotate(-1.5deg) scaleX(0.97)',
      handsOnHips: 'translate(0, 0) rotate(1deg) scaleX(0.98)',
      surprised: 'translate(0, -4px) rotate(0.8deg) scaleX(0.98)',
      fall: 'translate(12px, 40px) rotate(72deg) scale(0.96)',
      dance: 'translate(-3px, -3px) rotate(-2deg) scaleX(0.98)',
    };
    const target = transforms[pose];
    const duration = options.durationMs ?? 300;
    if (settings.reduceMotion) {
      this.content.style.transform = target;
      await sleep(120);
      return true;
    }
    await this.content.animate(
      [{ transform: this.content.style.transform || transforms.idle }, { transform: target }],
      { duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
    ).finished.catch(() => undefined);
    this.content.style.transform = target;
    return true;
  }

  async setEmotion(emotion: CharacterEmotion): Promise<void> {
    if (emotion !== 'neutral') {
      warnOnce(
        `sprite-emotion-${this.entry.displayName}`,
        `${this.entry.displayName} is a static sprite and can't change expression — staying neutral.`,
      );
    }
  }

  async playAction(action: CharacterAction, _options?: AnimationOptions): Promise<void> {
    if (!this.content) return;
    if (settings.reduceMotion) {
      await sleep(250);
      return;
    }

    const animate = (keyframes: Keyframe[], durationMs: number, iterations = 1) =>
      this.content!.animate(keyframes, {
        duration: durationMs,
        iterations,
        easing: 'ease-in-out',
      }).finished.catch(() => undefined);

    switch (action) {
      case 'jump':
        await animate([
          { transform: 'translateY(0)' },
          { transform: 'translateY(-60px)' },
          { transform: 'translateY(0)' },
        ], 700);
        return;
      case 'nod':
        await animate([
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(9deg)' },
          { transform: 'rotate(0deg)' },
        ], 600);
        return;
      case 'shakeHead':
      case 'tremble':
      case 'actScared':
        await animate([
          { transform: 'translateX(0)' },
          { transform: 'translateX(-7px)' },
          { transform: 'translateX(7px)' },
          { transform: 'translateX(0)' },
        ], 160, 6);
        return;
      case 'sit':
        await animate([
          { transform: 'translateY(0)' },
          { transform: 'translateY(40px) scaleY(0.85)' },
        ], 450);
        return;
      default:
        warnOnce(
          `sprite-action-${action}`,
          `Static sprites don't support "${action}" — settling into a clean pose.`,
        );
        await this.transitionToPose('idle', { durationMs: 280, motion: 'settle' });
    }
  }
}
