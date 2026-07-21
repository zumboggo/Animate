/** How long an autoplayed dialogue line stays on screen. */
export function dialogueMs(text: string): number {
  const chars = [...text].length;
  return clamp(1200 + 40 * chars, 1500, 6000);
}

/** Time to cross the full stage width. */
export const WALK_MS_FULL_STAGE = 2600;
export const RUN_MS_FULL_STAGE = 1400;
export const SWIM_MS_FULL_STAGE = 3200;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Awaits a CSS transition on `el`, with a timeout fallback so a missed
 * transitionend event (or zero-distance move) can never hang the story.
 */
export function waitTransition(el: HTMLElement, property: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener('transitionend', onEnd);
      resolve();
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.target === el && e.propertyName === property) finish();
    };
    el.addEventListener('transitionend', onEnd);
    setTimeout(finish, timeoutMs + 120);
  });
}
