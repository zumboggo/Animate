import { CharacterActor } from '../animation/characterActor';
import type { Narrator } from '../audio/narrator';
import type { BubbleLayer } from '../ui/bubbles';
import type { DialogueBox } from '../ui/dialogueBox';
import { settings } from './settings';
import type { Stage } from './stage';
import type { Cast, Story, StoryCommand } from './storyTypes';
import { dialogueMs, sleep } from './timing';

/**
 * Steps through a compiled story and performs it. Non-dialogue commands chain
 * automatically (each waits for its animation); dialogue pauses for a
 * click/space in manual mode, or a text-length timer in autoplay.
 */
export class Director {
  private actors = new Map<string, CharacterActor>();
  private aborted = false;
  private advanceWaiters: (() => void)[] = [];

  constructor(
    private story: Story,
    private cast: Cast,
    private stage: Stage,
    private bubbles: BubbleLayer,
    private dialogueBox: DialogueBox,
    private narrator: Narrator,
  ) {}

  /** Called by stage clicks / spacebar. */
  advance(): void {
    this.narrator.stop();
    const waiters = this.advanceWaiters;
    this.advanceWaiters = [];
    for (const resolve of waiters) resolve();
  }

  async run(): Promise<void> {
    this.dialogueBox.showTitleCard(this.story.title);
    await this.pause(2400);
    if (this.aborted) return;
    this.dialogueBox.hideCard();

    for (const cmd of this.story.commands) {
      if (this.aborted) return;
      try {
        await this.exec(cmd);
      } catch (err) {
        console.error(`[animate] Line ${cmd.line} failed:`, err);
      }
    }

    if (!this.aborted) this.dialogueBox.showEndCard();
  }

  dispose(): void {
    this.aborted = true;
    this.advance();
    this.bubbles.hide();
    this.dialogueBox.clear();
    this.narrator.stop();
    this.stage.showAdvanceHint(false);
    for (const actor of this.actors.values()) actor.unmount();
    this.actors.clear();
  }

  private async exec(cmd: StoryCommand): Promise<void> {
    switch (cmd.kind) {
      case 'scene':
        this.stage.setScene(cmd.scene);
        await sleep(550);
        return;

      case 'dialogue': {
        const actor = this.getActor(cmd.character);
        if (cmd.emotion) await actor.setEmotion(cmd.emotion);

        const anchor = actor.onStage ? actor.getElement() : null;
        if (anchor) {
          this.bubbles.show(actor.displayName, cmd.text, anchor);
        } else {
          this.dialogueBox.show(actor.displayName, cmd.text);
        }
        actor.startTalking();
        const narration = settings.voices
          ? this.narrator.speak({ character: cmd.character, text: cmd.text, emotion: cmd.emotion })
          : undefined;
        await this.pause(dialogueMs(cmd.text), narration);
        // dispose() already clears shared stage UI. An older director must not
        // wake up and erase dialogue that a newly submitted story just showed.
        if (this.aborted) return;
        actor.stopTalking();
        this.bubbles.hide();
        this.dialogueBox.hide();
        return;
      }

      case 'expression':
        await this.getActor(cmd.character).setEmotion(cmd.emotion);
        await sleep(350);
        return;

      case 'action':
        await this.getActor(cmd.character).perform(cmd);
        await sleep(140); // a small beat between actions reads better
        return;

      case 'wait':
        await sleep(cmd.ms);
        return;

      case 'effect': {
        const fx = this.stage.effects;
        switch (cmd.effect) {
          case 'screenShake':
            return void (await fx.screenShake());
          case 'fadeToBlack':
            return void (await fx.fadeToBlack());
          case 'fadeIn':
            return void (await fx.fadeIn());
          case 'cameraReset':
            return void (await fx.reset());
          case 'cameraZoom': {
            const target = cmd.target ? this.getActor(cmd.target) : null;
            return void (await fx.zoomOn(target ? target.getStageFraction() : 0.5));
          }
        }
      }
    }
  }

  /**
   * Waits for an advance click; in autoplay mode, also resolves after
   * `autoMs`. Checks the mode continuously so toggling autoplay mid-wait
   * takes effect immediately.
   */
  private async pause(autoMs: number, narration?: Promise<void>): Promise<void> {
    const started = performance.now();
    let clicked = false;
    let narrationDone = !narration;
    void narration?.finally(() => {
      narrationDone = true;
    });
    this.advanceWaiters.push(() => {
      clicked = true;
    });

    while (!this.aborted && !clicked) {
      if (settings.autoplay && narrationDone && performance.now() - started >= autoMs) break;
      this.stage.showAdvanceHint(!settings.autoplay);
      await sleep(90);
    }
    this.stage.showAdvanceHint(false);
  }

  private getActor(name: string): CharacterActor {
    let actor = this.actors.get(name);
    if (!actor) {
      const entry = this.cast[name] ?? {
        displayName: name,
        adapter: 'svgRig',
      };
      actor = new CharacterActor(name, entry);
      actor.mount(this.stage.actorLayer);
      this.actors.set(name, actor);
    }
    return actor;
  }
}
