import { OFFSTAGE, POSITIONS } from '../../engine/positions';
import { settings } from '../../engine/settings';
import type {
  CharacterAction,
  CharacterEmotion,
  EntrySide,
  Gait,
} from '../../engine/storyTypes';
import { RUN_MS_FULL_STAGE, SWIM_MS_FULL_STAGE, WALK_MS_FULL_STAGE, sleep, waitTransition } from '../../engine/timing';
import type {
  AnimationOptions,
  CharacterAnimationAdapter,
  CharacterPosition,
  MoveOptions,
} from '../animationTypes';

/**
 * Shared adapter plumbing: owns the positioned wrapper element and implements
 * generic stage travel (enter, exit, walk-to) as a CSS `left` transition.
 * Subclasses render the character into `inner` and animate the body via the
 * onMoveStart/onMoveEnd hooks and playAction.
 */
export abstract class BaseAdapter implements CharacterAnimationAdapter {
  protected wrapper: HTMLDivElement | null = null;
  protected inner: HTMLDivElement | null = null;
  protected fraction = 0.5;
  protected facing: EntrySide = 'right';

  mount(container: HTMLElement): void {
    if (this.wrapper) return;
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'actor';
    this.inner = document.createElement('div');
    this.inner.className = 'actor-inner';
    this.wrapper.appendChild(this.inner);
    this.applyFraction(this.fraction);
    this.wrapper.style.visibility = 'hidden';
    container.appendChild(this.wrapper);
    this.buildContent(this.inner);
  }

  unmount(): void {
    this.wrapper?.remove();
    this.wrapper = null;
    this.inner = null;
  }

  protected abstract buildContent(inner: HTMLElement): void;

  abstract setEmotion(emotion: CharacterEmotion, options?: AnimationOptions): Promise<void>;
  abstract playAction(action: CharacterAction, options?: AnimationOptions): Promise<void>;

  async setPosition(position: CharacterPosition, options?: MoveOptions): Promise<void> {
    this.show();
    await this.travelTo(POSITIONS[position], options?.gait ?? 'walk');
  }

  async enterFrom(side: EntrySide, to: CharacterPosition, gait: Gait): Promise<void> {
    this.teleport(OFFSTAGE[side]);
    this.show();
    await this.travelTo(POSITIONS[to], gait);
  }

  async exitTo(side: EntrySide, gait: Gait): Promise<void> {
    await this.travelTo(OFFSTAGE[side], gait);
    this.hide();
  }

  appearAt(position: CharacterPosition): void {
    this.teleport(POSITIONS[position]);
    this.show();
  }

  setFacing(direction: EntrySide): void {
    this.facing = direction;
    if (this.inner) {
      this.inner.style.transform = direction === 'left' ? 'scaleX(-1)' : '';
    }
  }

  startIdle(): void {}
  stopIdle(): void {}
  startTalking(): void {}
  stopTalking(): void {}

  getStageFraction(): number {
    return this.fraction;
  }

  getElement(): HTMLElement | null {
    return this.wrapper;
  }

  /** Instantly place the character (no transition). */
  teleport(fraction: number): void {
    if (!this.wrapper) return;
    this.wrapper.style.transitionDuration = '0s';
    this.applyFraction(fraction);
    // Force the style to land before any subsequent transition starts.
    void this.wrapper.offsetWidth;
  }

  show(): void {
    if (this.wrapper) this.wrapper.style.visibility = '';
  }

  hide(): void {
    if (this.wrapper) this.wrapper.style.visibility = 'hidden';
  }

  protected async travelTo(targetFraction: number, gait: Gait): Promise<void> {
    if (!this.wrapper) return;
    const distance = Math.abs(targetFraction - this.fraction);
    if (distance < 0.001) return;

    this.setFacing(targetFraction < this.fraction ? 'left' : 'right');

    if (settings.reduceMotion) {
      this.wrapper.style.opacity = '0';
      await sleep(220);
      this.teleport(targetFraction);
      this.wrapper.style.opacity = '1';
      await sleep(220);
      return;
    }

    const perStage = gait === 'run'
      ? RUN_MS_FULL_STAGE
      : gait === 'swim'
        ? SWIM_MS_FULL_STAGE
        : WALK_MS_FULL_STAGE;
    const ms = Math.max(350, distance * perStage);
    this.onMoveStart(gait);
    this.wrapper.style.transitionDuration = `${ms}ms`;
    this.applyFraction(targetFraction);
    await waitTransition(this.wrapper, 'left', ms);
    this.onMoveEnd();
  }

  /** Body animation while traveling (walk cycle, bobbing, ...). */
  protected onMoveStart(_gait: Gait): void {}
  protected onMoveEnd(): void {}

  private applyFraction(fraction: number): void {
    this.fraction = fraction;
    if (this.wrapper) this.wrapper.style.left = `${(fraction * 100).toFixed(2)}%`;
  }
}

const warned = new Set<string>();

/** Logs a development warning once per key, so stories keep playing quietly. */
export function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[animate] ${message}`);
}
