import { settings } from '../engine/settings';
import { createStoryPicker } from './storyPicker';

export interface ControlsCallbacks {
  onRestart(): void;
  onSelectStory(name: string): void;
}

/** The bar under the stage: story picker, restart, autoplay, reduce motion. */
export function buildControls(
  parent: HTMLElement,
  storyNames: string[],
  currentStory: string,
  cb: ControlsCallbacks,
): void {
  const bar = document.createElement('div');
  bar.className = 'controls';

  bar.appendChild(createStoryPicker(storyNames, currentStory, cb.onSelectStory));

  const restart = document.createElement('button');
  restart.textContent = '⟳ Restart';
  restart.addEventListener('click', cb.onRestart);
  bar.appendChild(restart);

  const autoplay = document.createElement('button');
  const renderAutoplay = () => {
    autoplay.textContent = settings.autoplay ? '▶ Autoplay: on' : '▶ Autoplay: off';
    autoplay.classList.toggle('toggled', settings.autoplay);
  };
  renderAutoplay();
  autoplay.addEventListener('click', () => {
    settings.autoplay = !settings.autoplay;
    renderAutoplay();
  });
  bar.appendChild(autoplay);

  const motion = document.createElement('button');
  const renderMotion = () => {
    motion.textContent = settings.reduceMotionToggle ? '🐢 Reduce motion: on' : '🐢 Reduce motion: off';
    motion.classList.toggle('toggled', settings.reduceMotionToggle);
  };
  renderMotion();
  motion.addEventListener('click', () => {
    settings.reduceMotion = !settings.reduceMotionToggle;
    renderMotion();
  });
  bar.appendChild(motion);

  const spacer = document.createElement('div');
  spacer.className = 'spacer';
  bar.appendChild(spacer);

  const hint = document.createElement('span');
  hint.className = 'hint-text';
  hint.textContent = 'Click the stage or press Space to advance';
  bar.appendChild(hint);

  parent.appendChild(bar);
}
