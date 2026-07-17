import { defaultEntryTarget } from '../engine/positions';
import type {
  CastEntry,
  CharacterEmotion,
  EntrySide,
  StoryCommand,
} from '../engine/storyTypes';
import type { CharacterAnimationAdapter } from './animationTypes';
import { createAdapter } from './animationRegistry';
import { warnOnce } from './adapters/baseAdapter';

type ActionCmd = Extract<StoryCommand, { kind: 'action' }>;

/**
 * One character in the running story. Tracks stage state (on stage? sitting?
 * fallen?) and turns story actions into adapter calls, adding the small bits
 * of stagecraft the script leaves implicit — standing up before walking,
 * appearing if the author forgot an entrance, and so on.
 */
export class CharacterActor {
  readonly adapter: CharacterAnimationAdapter;
  onStage = false;
  private sitting = false;
  private fallen = false;

  constructor(
    readonly name: string,
    readonly entry: CastEntry,
  ) {
    this.adapter = createAdapter(entry);
  }

  get displayName(): string {
    return this.entry.displayName;
  }

  mount(container: HTMLElement): void {
    this.adapter.mount(container);
  }

  unmount(): void {
    this.adapter.unmount();
    this.onStage = false;
    this.sitting = false;
    this.fallen = false;
  }

  async setEmotion(emotion: CharacterEmotion): Promise<void> {
    await this.adapter.setEmotion(emotion);
  }

  startTalking(): void {
    this.adapter.startTalking?.();
  }

  stopTalking(): void {
    this.adapter.stopTalking?.();
  }

  getStageFraction(): number {
    return this.adapter.getStageFraction();
  }

  getElement(): HTMLElement | null {
    return this.adapter.getElement();
  }

  async perform(cmd: ActionCmd): Promise<void> {
    if (cmd.emotion) await this.adapter.setEmotion(cmd.emotion);

    switch (cmd.action) {
      case 'walkIn':
      case 'runIn': {
        const side: EntrySide = cmd.from ?? 'left';
        const to = cmd.to ?? defaultEntryTarget(side);
        await this.adapter.enterFrom(side, to, cmd.gait);
        this.onStage = true;
        return;
      }

      case 'walkOut':
      case 'runOut': {
        if (!this.onStage) {
          warnOnce(`exit-${this.name}`, `${this.displayName} tried to leave but isn't on stage.`);
          return;
        }
        await this.ensureUpright();
        const side: EntrySide = cmd.from ?? (this.getStageFraction() < 0.5 ? 'left' : 'right');
        await this.adapter.exitTo(side, cmd.gait);
        this.onStage = false;
        return;
      }

      case 'walkTo': {
        this.autoAppearIfNeeded(cmd.line);
        await this.ensureUpright();
        await this.adapter.setPosition(cmd.to ?? 'center', { gait: cmd.gait });
        return;
      }

      case 'sit':
        this.autoAppearIfNeeded(cmd.line);
        await this.ensureUpright();
        await this.adapter.playAction('sit');
        this.sitting = true;
        return;

      case 'stand':
        this.autoAppearIfNeeded(cmd.line);
        await this.adapter.playAction('stand');
        this.sitting = false;
        this.fallen = false;
        return;

      case 'fall':
        this.autoAppearIfNeeded(cmd.line);
        await this.ensureUpright();
        await this.adapter.playAction('fall');
        this.fallen = true;
        return;

      default:
        this.autoAppearIfNeeded(cmd.line);
        await this.ensureUpright();
        await this.adapter.playAction(cmd.action);
    }
  }

  /** Reset for a story restart. */
  reset(): void {
    this.onStage = false;
    this.sitting = false;
    this.fallen = false;
  }

  private async ensureUpright(): Promise<void> {
    if (!this.sitting && !this.fallen) return;
    await this.adapter.playAction('stand');
    this.sitting = false;
    this.fallen = false;
  }

  private autoAppearIfNeeded(line: number): void {
    if (this.onStage) return;
    warnOnce(
      `appear-${this.name}`,
      `${this.displayName} acted on line ${line} without entering first — appearing at center. ` +
        `Add "${this.name} walks in from left" for a proper entrance.`,
    );
    this.adapter.appearAt('center');
    this.onStage = true;
  }
}
