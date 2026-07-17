import { clamp } from '../engine/timing';

/** Speech bubbles anchored above whoever is talking. */
export class BubbleLayer {
  private current: HTMLDivElement | null = null;

  constructor(private layer: HTMLElement, private stageEl: HTMLElement) {}

  show(displayName: string, text: string, anchor: HTMLElement): void {
    this.hide();
    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    const name = document.createElement('div');
    name.className = 'bubble-name';
    name.textContent = displayName;
    const body = document.createElement('div');
    body.textContent = text;
    bubble.append(name, body);

    const stageRect = this.stageEl.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const centerX = (anchorRect.left + anchorRect.right) / 2 - stageRect.left;
    const leftPct = clamp((centerX / stageRect.width) * 100, 14, 86);
    const top = Math.max(anchorRect.top - stageRect.top - 6, stageRect.height * 0.04);

    bubble.style.left = `${leftPct.toFixed(1)}%`;
    bubble.style.top = `${top.toFixed(0)}px`;

    this.layer.appendChild(bubble);
    this.current = bubble;
  }

  hide(): void {
    this.current?.remove();
    this.current = null;
  }
}
