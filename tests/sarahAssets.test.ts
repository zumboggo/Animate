import { describe, expect, it } from 'vitest';
import sarah from '../public/assets/characters/sarah/character.json';
import cast from '../stories/cast.json';

describe('Sarah generated-art character', () => {
  it('uses the hybrid bone-and-pose adapter at toddler scale', () => {
    expect(cast.SARAH.adapter).toBe('puppetParts');
    expect(cast.SARAH.scale).toBeGreaterThanOrEqual(0.82);
    expect(cast.SARAH.scale).toBeLessThanOrEqual(0.88);
    expect(cast.SARAH.scale).toBeLessThan(cast.ANNA.appearance.height);
    expect(cast.SARAH.asset).toBe('assets/characters/sarah/poses/neutral.png');
    expect(cast.SARAH.faceAnimation).toBe('mouthOnly');
  });

  it('keeps Sarah\u2019s face calm and swaps only aligned whole-head talk frames', () => {
    expect(sarah.renderMode).toBe('hybrid');
    expect(Object.keys(sarah.rig.bones)).toHaveLength(12);
    expect(sarah.rig.layers).toHaveLength(12);
    expect(sarah.rig.talkingHead).toBe(true);
    expect(sarah.rig).not.toHaveProperty('face');
    expect(sarah.rig.layers.filter((layer) => layer.feature === 'headClosed')).toHaveLength(1);
    expect(sarah.rig.layers.filter((layer) => layer.feature === 'headOpen')).toHaveLength(1);
    expect(sarah.rig.layers.find((layer) => layer.name === 'torso')?.asset).toContain('torso-clean-v2');
    expect(sarah.assetStatus).toEqual({
      poseSprites: 'ready',
      bodyParts: 'two-piece limbs ready for smooth layered animation',
      faceParts: 'aligned full-head closed/open dialogue frames; expressions use pose sprites',
    });
  });

  it('maps difficult actions to coherent Sarah pose art', () => {
    expect(cast.SARAH.poseAssets).toMatchObject({
      sit: 'assets/characters/sarah/poses/seated.png',
      point: 'assets/characters/sarah/poses/pointing.png',
      laugh: 'assets/characters/sarah/poses/laughing.png',
      scared: 'assets/characters/sarah/poses/scared.png',
    });
  });

  it('keeps a clean emotion fallback for every supported expression', () => {
    expect(Object.keys(cast.SARAH.emotionAssets).sort()).toEqual([
      'angry',
      'confused',
      'happy',
      'laughing',
      'neutral',
      'sad',
      'scared',
      'surprised',
    ]);
  });
});
