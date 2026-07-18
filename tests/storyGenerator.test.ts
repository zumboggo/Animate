import { describe, expect, it, vi } from 'vitest';
import { slugify, uniqueSceneName } from '../src/ai/backgroundLibrary';
import {
  buildSystemPrompt,
  cleanScript,
  extractSetting,
  extractTitle,
  generateStoryScript,
  replaceSceneLine,
  type GenerateStoryOptions,
} from '../src/ai/storyGenerator';
import type { Cast } from '../src/engine/storyTypes';

const cast: Cast = {
  ANNA: { displayName: 'Anna', adapter: 'svgRig' },
  SARAH: { displayName: 'Sarah', adapter: 'svgRig' },
  LEAH: { displayName: 'Leah', adapter: 'svgRig' },
};

function options(overrides: Partial<GenerateStoryOptions> = {}): GenerateStoryOptions {
  return {
    apiKey: 'sk-or-test',
    model: 'test-model',
    prompt: 'a picnic',
    characters: ['ANNA', 'SARAH'],
    language: 'english',
    length: 'short',
    scenes: ['park', 'bedroom'],
    cast,
    ...overrides,
  };
}

describe('prompt building', () => {
  it('teaches the exact engine vocabulary', () => {
    const system = buildSystemPrompt(options());
    expect(system).toContain('shakes head');
    expect(system).toContain('acts like a tree');
    expect(system).toContain('laughing');
    expect(system).toContain('park, bedroom');
    expect(system).toContain('ANNA (Anna)');
    expect(system).not.toContain('LEAH');
  });

  it('describes bilingual format when selected', () => {
    const system = buildSystemPrompt(options({ language: 'bilingual' }));
    expect(system).toContain('你好');
    expect(system).toContain('English translation');
  });
});

describe('script post-processing', () => {
  it('strips markdown fences and leading prose', () => {
    expect(cleanScript('```\ntitle: Hi\nANNA waves\n```')).toBe('title: Hi\nANNA waves');
    expect(cleanScript('Here is your story!\ntitle: Hi\nANNA waves')).toBe('title: Hi\nANNA waves');
  });

  it('extracts title and setting', () => {
    const script = 'title: The Picnic\n# setting: a sunny hillside with a red blanket\nscene: park';
    expect(extractTitle(script)).toBe('The Picnic');
    expect(extractSetting(script)).toBe('a sunny hillside with a red blanket');
  });

  it('replaces the scene line with a generated scene', () => {
    const script = 'title: Hi\n# setting: a beach\nscene: park\nANNA waves';
    expect(replaceSceneLine(script, 'sunny-beach')).toContain('scene: sunny-beach');
    expect(replaceSceneLine(script, 'sunny-beach')).not.toContain('scene: park');
  });

  it('inserts a scene line when the script forgot one', () => {
    const script = 'title: Hi\nANNA waves';
    expect(replaceSceneLine(script, 'sunny-beach')).toBe('title: Hi\nscene: sunny-beach\nANNA waves');
  });
});

describe('generate with validate-and-fix loop', () => {
  const goodScript = [
    'title: The Picnic',
    '# setting: a sunny hillside',
    'scene: park',
    'ANNA walks in from left',
    'ANNA (happy): What a day!',
  ].join('\n');

  it('returns a clean script on the first try', async () => {
    const chat = vi.fn().mockResolvedValue(goodScript);
    const result = await generateStoryScript(options(), chat);
    expect(chat).toHaveBeenCalledTimes(1);
    expect(result.errors).toEqual([]);
    expect(result.title).toBe('The Picnic');
    expect(result.setting).toBe('a sunny hillside');
  });

  it('sends compile errors back and accepts the fixed script', async () => {
    const broken = goodScript.replace('ANNA walks in from left', 'ANNA wlks in from left');
    const chat = vi.fn().mockResolvedValueOnce(broken).mockResolvedValueOnce(goodScript);
    const result = await generateStoryScript(options(), chat);
    expect(chat).toHaveBeenCalledTimes(2);
    expect(result.errors).toEqual([]);
    const feedback = chat.mock.calls[1][0].messages.at(-1);
    expect(feedback.content).toContain('Line 4');
  });

  it('gives up after two fix attempts and reports remaining errors', async () => {
    const broken = goodScript.replace('ANNA walks in from left', 'ANNA teleports');
    const chat = vi.fn().mockResolvedValue(broken);
    const result = await generateStoryScript(options(), chat);
    expect(chat).toHaveBeenCalledTimes(3);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('scene naming', () => {
  it('slugifies settings into short scene names', () => {
    expect(slugify('A sunny hillside with a red blanket!')).toBe('a-sunny-hillside-with');
    expect(slugify('海边 beach day')).toBe('beach-day');
    expect(slugify('！！！')).toBe('scene');
  });

  it('de-dupes against existing scene names', () => {
    expect(uniqueSceneName('beach', ['park'])).toBe('beach');
    expect(uniqueSceneName('beach', ['beach', 'beach-2'])).toBe('beach-3');
  });
});
