import { settings } from '../engine/settings';
import { sleep } from '../engine/timing';

/**
 * Camera and screen effects. Zoom lives on the camera element and shake on a
 * nested layer, so the two transforms never fight each other — and neither
 * touches character transforms.
 */
export class StageEffects {
  constructor(
    private camera: HTMLElement,
    private shakeLayer: HTMLElement,
    private fadeOverlay: HTMLElement,
  ) {}

  async screenShake(): Promise<void> {
    if (settings.reduceMotion) {
      await sleep(200);
      return;
    }
    this.shakeLayer.classList.remove('shaking');
    void this.shakeLayer.offsetWidth;
    this.shakeLayer.classList.add('shaking');
    await sleep(550);
    this.shakeLayer.classList.remove('shaking');
  }

  async fadeToBlack(): Promise<void> {
    this.fadeOverlay.style.opacity = '1';
    await sleep(760);
  }

  async fadeIn(): Promise<void> {
    this.fadeOverlay.style.opacity = '0';
    await sleep(760);
  }

  async zoomOn(stageFraction: number): Promise<void> {
    this.camera.style.transformOrigin = `${(stageFraction * 100).toFixed(1)}% 62%`;
    this.camera.style.transform = 'scale(1.55)';
    await sleep(680);
  }

  async reset(): Promise<void> {
    this.camera.style.transform = 'scale(1)';
    await sleep(680);
  }

  /** Instantly clear everything (used on restart). */
  clear(): void {
    this.camera.style.transform = '';
    this.fadeOverlay.style.opacity = '0';
    this.shakeLayer.classList.remove('shaking');
  }
}
