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

  it('keeps Sarah’s illustrated face calm and animates only her mouth', () => {
    expect(sarah.renderMode).toBe('hybrid');
    expect(Object.keys(sarah.rig.bones)).toHaveLength(12);
    expect(sarah.rig.layers).toHaveLength(16);
    expect(sarah.rig.face.mode).toBe('mouthOnly');
    expect(sarah.assetStatus).toEqual({
      poseSprites: 'ready',
      bodyParts: 'two-piece limbs ready for smooth layered animation',
      faceParts: 'illustrated eyes and brows stay still; only the mouth animates',
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
