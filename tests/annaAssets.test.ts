import { describe, expect, it } from 'vitest';
import anna from '../public/assets/characters/anna/character.json';
import cast from '../stories/cast.json';

describe('Anna generated-art character', () => {
  it('uses the hybrid bone-and-pose adapter above Sarah toddler scale', () => {
    expect(cast.ANNA.adapter).toBe('puppetParts');
    expect(cast.ANNA.scale).toBe(1);
    expect(cast.ANNA.scale).toBeGreaterThan(cast.SARAH.scale);
    expect(cast.ANNA.asset).toBe('assets/characters/anna/poses/neutral.png');
  });

  it('maps difficult actions to coherent Anna pose art', () => {
    expect(cast.ANNA.poseAssets).toMatchObject({
      sit: 'assets/characters/anna/poses/seated.png',
      point: 'assets/characters/anna/poses/pointing.png',
      laugh: 'assets/characters/anna/poses/laughing.png',
      scared: 'assets/characters/anna/poses/scared.png',
    });
  });

  it('publishes a matching parts-and-face manifest for rig assembly', () => {
    expect(anna.renderMode).toBe('hybrid');
    expect(Object.keys(anna.rig.bones)).toHaveLength(12);
    expect(anna.rig.layers).toHaveLength(16);
    expect(anna.paths).toMatchObject({
      parts: 'assets/characters/anna/parts',
      face: 'assets/characters/anna/face',
      poses: 'assets/characters/anna/poses',
    });
    expect(anna.assetStatus).toEqual({
      poseSprites: 'ready',
      bodyParts: 'two-piece limbs ready for smooth layered animation',
      faceParts: 'ready for blink and talk-shape assembly',
    });
    expect(Object.keys(anna.poses)).toHaveLength(7);
  });
});
