import { describe, expect, it } from 'vitest';
import { actionCue, dialogueCue, expressionCue } from '../src/animation/poseLibrary';
import { RIG_POSES } from '../src/rig/poseTemplates';
import type { CharacterPose } from '../src/engine/storyTypes';

const NAMED_POSES: CharacterPose[] = [
  'idle',
  'talkNeutral',
  'talkHappy',
  'talkAngry',
  'scared',
  'laugh',
  'sit',
  'point',
  'handsOnHips',
  'surprised',
  'fall',
  'dance',
];

describe('hybrid acting pose library', () => {
  it('provides reusable rig templates for every director pose', () => {
    expect(Object.keys(RIG_POSES).sort()).toEqual([...NAMED_POSES].sort());
    for (const pose of NAMED_POSES) {
      expect(RIG_POSES[pose].presentation).toContain('scale');
    }
  });

  it('maps emotional dialogue to matching talk acting', () => {
    expect(dialogueCue().pose).toBe('talkNeutral');
    expect(dialogueCue('happy')).toMatchObject({ pose: 'talkHappy', motion: 'talk' });
    expect(dialogueCue('angry')).toMatchObject({ pose: 'talkAngry', motion: 'talk' });
    expect(dialogueCue('scared')).toMatchObject({ pose: 'scared', motion: 'recoil' });
    expect(dialogueCue('surprised')).toMatchObject({ pose: 'surprised', motion: 'settle' });
  });

  it('prefers special-pose assets for difficult full-body actions', () => {
    for (const action of ['sit', 'point', 'laugh', 'actScared', 'fall', 'dance'] as const) {
      expect(actionCue(action)?.preferSprite).toBe(true);
    }
    expect(actionCue('wave')).toBeUndefined();
  });

  it('keeps emotional expression beats restrained', () => {
    expect(expressionCue('scared')).toMatchObject({ pose: 'scared', motion: 'recoil' });
    expect(expressionCue('happy')).toMatchObject({ pose: 'idle', motion: 'settle' });
  });

  it('supports per-character pose overrides without changing story syntax', () => {
    expect(actionCue('wave', 'handsOnHips')).toMatchObject({ pose: 'handsOnHips', motion: 'settle' });
    expect(actionCue('point', 'handsOnHips')).toMatchObject({ pose: 'handsOnHips', preferSprite: true });
  });
});
