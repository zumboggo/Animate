import type { CastEntry, CharacterAction, CharacterEmotion } from '../../engine/storyTypes';
import { settings } from '../../engine/settings';
import { sleep } from '../../engine/timing';
import type { AnimationOptions } from '../animationTypes';
import { BaseAdapter, warnOnce } from './baseAdapter';

/**
 * Simplest possible adapter: one full-body image (or a built-in placeholder
 * blob) animated with CSS/Web Animations. Emotions fall back to neutral.
 * Useful as a graceful fallback and as the base for future asset adapters.
 */
export class StaticSpriteAdapter extends BaseAdapter {
  protected content: HTMLElement | SVGSVGElement | null = null;

  constructor(protected entry: CastEntry) {
    super();
  }

  protected buildContent(inner: HTMLElement): void {
    if (this.entry.asset) {
      const img = document.createElement('img');
      img.src = this.entry.asset;
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
          `Static sprites don't support "${action}" — using a bounce instead.`,
        );
        await animate([
          { transform: 'translateY(0)' },
          { transform: 'translateY(-18px)' },
          { transform: 'translateY(0)' },
        ], 500);
    }
  }
}
