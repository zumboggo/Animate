import { settings } from '../engine/settings';

export interface ControlsCallbacks {
  onRestart(): void;
}

/** The bar under the stage: playback and accessibility controls. */
export function buildControls(
  parent: HTMLElement,
  cb: ControlsCallbacks,
): void {
  const bar = document.createElement('div');
  bar.className = 'controls';

  const restart = document.createElement('button');
  restart.innerHTML = '<span aria-hidden="true">↻</span> Restart';
  restart.addEventListener('click', cb.onRestart);
  bar.appendChild(restart);

  const autoplay = document.createElement('button');
  const renderAutoplay = () => {
    autoplay.textContent = settings.autoplay ? '▶ Autoplay on' : '▶ Autoplay off';
    autoplay.classList.toggle('toggled', settings.autoplay);
  };
  renderAutoplay();
  autoplay.addEventListener('click', () => {
    settings.autoplay = !settings.autoplay;
    renderAutoplay();
  });
  bar.appendChild(autoplay);

  const voices = document.createElement('button');
  const renderVoices = () => {
    voices.textContent = settings.voices ? '🔊 Voices on' : '🔇 Voices off';
    voices.classList.toggle('toggled', settings.voices);
    voices.setAttribute('aria-pressed', String(settings.voices));
    voices.title = 'Speak dialogue with private character voices (sign-in required)';
  };
  renderVoices();
  voices.addEventListener('click', () => {
    settings.voices = !settings.voices;
    renderVoices();
  });
  bar.appendChild(voices);

  const motion = document.createElement('button');
  const renderMotion = () => {
    motion.textContent = settings.reduceMotionToggle ? '◌ Reduce motion on' : '◌ Reduce motion off';
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
