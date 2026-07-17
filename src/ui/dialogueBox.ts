/**
 * Bottom dialogue box, used when the speaker isn't on stage (and, later, for
 * narrator lines). Also owns the title and end cards.
 */
export class DialogueBox {
  private box: HTMLDivElement | null = null;
  private card: HTMLDivElement | null = null;

  constructor(private stageEl: HTMLElement) {}

  show(displayName: string, text: string): void {
    this.hide();
    this.box = document.createElement('div');
    this.box.className = 'dialogue-box';
    const name = document.createElement('div');
    name.className = 'bubble-name';
    name.textContent = displayName;
    const body = document.createElement('div');
    body.textContent = text;
    this.box.append(name, body);
    this.stageEl.appendChild(this.box);
  }

  hide(): void {
    this.box?.remove();
    this.box = null;
  }

  showTitleCard(title: string): void {
    this.showCard(title, 'Click, tap, or press Space to begin');
  }

  showEndCard(): void {
    this.showCard('The End', 'Press Restart to watch it again');
  }

  hideCard(): void {
    this.card?.remove();
    this.card = null;
  }

  clear(): void {
    this.hide();
    this.hideCard();
  }

  private showCard(heading: string, sub: string): void {
    this.hideCard();
    this.card = document.createElement('div');
    this.card.className = 'story-card';
    const h = document.createElement('h1');
    h.textContent = heading;
    const p = document.createElement('p');
    p.textContent = sub;
    this.card.append(h, p);
    this.stageEl.appendChild(this.card);
  }
}
