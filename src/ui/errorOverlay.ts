import type { StoryError } from '../engine/storyTypes';

/** Full-stage panel for script problems — a bad story never means a blank page. */
export class ErrorOverlay {
  private el: HTMLDivElement | null = null;

  constructor(private stageEl: HTMLElement) {}

  show(storyName: string, errors: StoryError[], authoring = false): void {
    this.hide();
    this.el = document.createElement('div');
    this.el.className = 'error-overlay';

    const h = document.createElement('h2');
    h.textContent = '🎬 Oops — the script needs a little fix';
    const sub = document.createElement('p');
    sub.className = 'error-sub';
    sub.textContent = authoring
      ? `Found ${errors.length === 1 ? 'one thing' : errors.length + ' things'} to fix in “${storyName}”. Use the line links beside the editor to jump right there.`
      : `Found ${errors.length === 1 ? 'one thing' : errors.length + ' things'} to fix in “${storyName}”. Save the file and this page will refresh.`;

    const list = document.createElement('ul');
    for (const err of [...errors].sort((a, b) => a.line - b.line)) {
      const item = document.createElement('li');
      const lineNo = document.createElement('span');
      lineNo.className = 'line-no';
      lineNo.textContent = `Line ${err.line}:`;
      item.appendChild(lineNo);
      item.appendChild(document.createTextNode(err.message));
      list.appendChild(item);
    }

    this.el.append(h, sub, list);
    this.stageEl.appendChild(this.el);
  }

  hide(): void {
    this.el?.remove();
    this.el = null;
  }
}
