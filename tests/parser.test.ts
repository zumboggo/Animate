import { describe, expect, it } from 'vitest';
import { parseStory } from '../src/engine/parser';
import { compileStory } from '../src/engine/validator';
import type { StoryCommand } from '../src/engine/storyTypes';

const OPTS = {
  characters: ['LIN', 'MAX', 'MEI', 'ANNA', 'SARAH', 'GRACE', 'ELLIOTT', 'LEAH'],
  scenes: ['park', 'camp', 'cabin-dining', 'bedroom', 'street', 'peppa-land', 'lake'],
};

function compile(source: string) {
  return compileStory(source, OPTS);
}

function commandsOf(source: string): StoryCommand[] {
  const { story, errors } = compile(source);
  expect(errors).toEqual([]);
  return story.commands;
}

describe('parser: dialogue', () => {
  it('parses plain dialogue', () => {
    const [cmd] = commandsOf('LIN: What a beautiful day!');
    expect(cmd).toMatchObject({ kind: 'dialogue', character: 'LIN', text: 'What a beautiful day!' });
  });

  it('parses dialogue with an emotion', () => {
    const [cmd] = commandsOf("MAX (scared): There's a spider!!");
    expect(cmd).toMatchObject({ kind: 'dialogue', character: 'MAX', emotion: 'scared' });
  });

  it('keeps Chinese text intact and accepts the full-width colon', () => {
    const [a, b] = commandsOf('MEI: 你好！\nMEI (happy)：我很高兴。');
    expect(a).toMatchObject({ kind: 'dialogue', text: '你好！' });
    expect(b).toMatchObject({ kind: 'dialogue', emotion: 'happy', text: '我很高兴。' });
  });

  it('rejects empty dialogue kindly', () => {
    const { errors } = compile('LIN:');
    expect(errors[0].message).toContain('nothing to say');
  });
});

describe('parser: actions', () => {
  it('parses an entrance with a side', () => {
    const [cmd] = commandsOf('LIN walks in from left');
    expect(cmd).toMatchObject({ kind: 'action', action: 'walkIn', from: 'left', gait: 'walk' });
  });

  it('parses running entrances', () => {
    const [cmd] = commandsOf('MAX runs in from right');
    expect(cmd).toMatchObject({ kind: 'action', action: 'runIn', from: 'right', gait: 'run' });
  });

  it('parses walk-to with positions, including far left/right', () => {
    const cmds = commandsOf('LIN walks to center\nMAX walks to far right');
    expect(cmds[0]).toMatchObject({ action: 'walkTo', to: 'center' });
    expect(cmds[1]).toMatchObject({ action: 'walkTo', to: 'farRight' });
  });

  it('parses multi-word verbs', () => {
    const cmds = commandsOf('LIN shakes head\nMAX acts scared\nMEI turns around');
    expect(cmds[0]).toMatchObject({ action: 'shakeHead' });
    expect(cmds[1]).toMatchObject({ action: 'actScared', emotion: 'scared' });
    expect(cmds[2]).toMatchObject({ action: 'turnAround' });
  });

  it('maps variants onto the same action', () => {
    const cmds = commandsOf('LIN trembles\nLIN shakes\nLIN shivers');
    for (const cmd of cmds) expect(cmd).toMatchObject({ action: 'tremble' });
  });

  it('accepts readable pose and small-motion actions', () => {
    const commands = commandsOf('ANNA recoils\nANNA bounces\nANNA puts hands on hips');
    expect(commands.map((command) => command.kind === 'action' ? command.action : '')).toEqual([
      'recoil', 'bounce', 'handsOnHips',
    ]);
  });

  it('parses expression + action', () => {
    const [cmd] = commandsOf('LIN (angry) shakes head');
    expect(cmd).toMatchObject({ kind: 'action', action: 'shakeHead', emotion: 'angry' });
  });

  it('parses expression-only lines', () => {
    const [cmd] = commandsOf('MAX (confused)');
    expect(cmd).toMatchObject({ kind: 'expression', character: 'MAX', emotion: 'confused' });
  });

  it('asks for a direction on bare walks', () => {
    const { errors } = compile('LIN walks');
    expect(errors[0].message).toContain('needs a direction');
  });
});

describe('parser: structure', () => {
  it('reads title and scene, skipping comments and blanks', () => {
    const { story, errors } = compile('# a note\n\ntitle: The Spider\nscene: park\n');
    expect(errors).toEqual([]);
    expect(story.title).toBe('The Spider');
    expect(story.commands[0]).toMatchObject({ kind: 'scene', scene: 'park' });
  });

  it('parses waits in seconds and milliseconds', () => {
    const cmds = commandsOf('wait 2s\nwait 500ms\nwait 1.5');
    expect(cmds).toMatchObject([{ ms: 2000 }, { ms: 500 }, { ms: 1500 }]);
  });

  it('parses stage effects', () => {
    const cmds = commandsOf('screen shakes\ncamera zooms on LIN\ncamera resets\nfade to black\nfade in');
    expect(cmds.map((c) => (c.kind === 'effect' ? c.effect : c.kind))).toEqual([
      'screenShake', 'cameraZoom', 'cameraReset', 'fadeToBlack', 'fadeIn',
    ]);
    expect(cmds[1]).toMatchObject({ target: 'LIN' });
  });

  it('rejects branching syntax with a coming-soon message', () => {
    const { errors } = compile('[ending]\nchoice:\ngoto ending');
    expect(errors).toHaveLength(3);
    for (const err of errors) expect(err.message).toContain('coming soon');
  });

  it('reports the correct line numbers', () => {
    const { errors } = parseStory('title: Ok\n\nLIN dnces\n');
    expect(errors).toEqual([]); // syntax is fine; the verb error is semantic
    const compiled = compile('title: Ok\n\nLIN dnces\n');
    expect(compiled.errors[0].line).toBe(3);
  });
});

describe('validator: friendly suggestions', () => {
  it('suggests the nearest action for a typo', () => {
    const { errors } = compile('LIN trmbles');
    expect(errors[0].message).toBe('I don\'t know the action "trmbles". Did you mean "trembles"?');
  });

  it('suggests the nearest character', () => {
    const { errors } = compile('LNI: Hello!');
    expect(errors[0].message).toContain('Unknown character "LNI"');
    expect(errors[0].message).toContain('Did you mean "LIN"?');
  });

  it('suggests the nearest emotion', () => {
    const { errors } = compile('LIN (scarred): eek');
    expect(errors[0].message).toContain('Did you mean "scared"?');
  });

  it('suggests the nearest scene', () => {
    const { errors } = compile('scene: pakr');
    expect(errors[0].message).toContain('Did you mean "park"?');
  });

  it('accepts emotion synonyms', () => {
    const [cmd] = commandsOf('LIN (mad): grr');
    expect(cmd).toMatchObject({ emotion: 'angry' });
  });

  it('matches character names case-insensitively', () => {
    const [cmd] = commandsOf('lin waves');
    expect(cmd).toMatchObject({ character: 'LIN', action: 'wave' });
  });
});

describe('the shipped demo stories compile cleanly', () => {
  it('does not ship stories featuring retired example characters', async () => {
    const sources = await Promise.all([
      import('../stories/family-playtime.story?raw'),
      import('../stories/chinese-playtime.story?raw'),
      import('../stories/sisters.story?raw'),
      import('../stories/peppa-land-adventure.story?raw'),
      import('../stories/treat-spot-trees.story?raw'),
      import('../stories/spider.story?raw'),
      import('../stories/pancake-payback.story?raw'),
    ]);
    for (const { default: source } of sources) {
      expect(source).not.toMatch(/^\s*(?:LIN|MAX|MEI)\b/m);
    }
  });

  it('family-playtime.story has no errors', async () => {
    const { default: source } = await import('../stories/family-playtime.story?raw');
    expect(compile(source).errors).toEqual([]);
  });

  it('chinese-playtime.story has no errors', async () => {
    const { default: source } = await import('../stories/chinese-playtime.story?raw');
    expect(compile(source).errors).toEqual([]);
  });

  it('sisters.story has no errors', async () => {
    const { default: source } = await import('../stories/sisters.story?raw');
    expect(compile(source).errors).toEqual([]);
  });

  it('peppa-land-adventure.story has no errors', async () => {
    const { default: source } = await import('../stories/peppa-land-adventure.story?raw');
    expect(compile(source).errors).toEqual([]);
  });

  it('treat-spot-trees.story has no errors', async () => {
    const { default: source } = await import('../stories/treat-spot-trees.story?raw');
    expect(compile(source).errors).toEqual([]);
  });

  it('parses swimming entrances and maps the shore to the lake edge', () => {
    const commands = commandsOf('SARAH swims in from left to center\nSARAH swims to shore');
    expect(commands[0]).toMatchObject({ action: 'walkIn', from: 'left', to: 'center', gait: 'swim' });
    expect(commands[1]).toMatchObject({ action: 'walkTo', to: 'farRight', gait: 'swim' });
  });

  it('pancake-payback.story has no errors and stars Grace and Elliott', async () => {
    const { default: source } = await import('../stories/pancake-payback.story?raw');
    const result = compile(source);
    expect(result.errors).toEqual([]);
    const characters = new Set(
      result.story.commands.flatMap((command) => ('character' in command ? [command.character] : [])),
    );
    expect(characters).toEqual(new Set(['GRACE', 'ELLIOTT']));
  });

  it('spider.story has no errors and uses Anna and Sarah', async () => {
    const { default: source } = await import('../stories/spider.story?raw');
    const result = compile(source);
    expect(result.errors).toEqual([]);
    const characters = new Set(
      result.story.commands.flatMap((command) => ('character' in command ? [command.character] : [])),
    );
    expect(characters).toEqual(new Set(['ANNA', 'SARAH']));
  });
});
