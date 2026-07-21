import { describe, expect, it } from 'vitest';
import anna from '../public/assets/characters/anna/character.json';
import cast from '../stories/cast.json';

describe('Anna generated-art character', () => {
  it('uses the hybrid bone-and-pose adapter on the shared actor scale', () => {
    expect(cast.ANNA.adapter).toBe('puppetParts');
    expect(cast.ANNA.scale).toBe(1);
    expect(cast.ANNA.scale).toBe(cast.SARAH.scale);
    expect(cast.ANNA.asset).toBe('assets/characters/anna/poses/neutral.png');
    expect(cast.ANNA.faceAnimation).toBe('mouthOnly');
  });

  it('maps difficult actions to coherent Anna pose art', () => {
    expect(cast.ANNA.poseAssets).toMatchObject({
      sit: 'assets/characters/anna/poses/seated.png',
      point: 'assets/characters/anna/poses/pointing.png',
      laugh: 'assets/characters/anna/poses/laughing.png',
      scared: 'assets/characters/anna/poses/scared.png',
    });
  });

  it('uses aligned whole-head dialogue frames without independent facial motion', () => {
    expect(anna.renderMode).toBe('hybrid');
    expect(Object.keys(anna.rig.bones)).toHaveLength(12);
    expect(anna.rig.layers).toHaveLength(12);
    expect(anna.rig.talkingHead).toBe(true);
    expect(anna.rig).not.toHaveProperty('face');
    expect(anna.rig.layers.filter((layer) => layer.feature === 'headClosed')).toHaveLength(1);
    expect(anna.rig.layers.filter((layer) => layer.feature === 'headOpen')).toHaveLength(1);
    expect(anna.paths).toMatchObject({
      parts: 'assets/characters/anna/parts',
      face: 'assets/characters/anna/face',
      poses: 'assets/characters/anna/poses',
    });
    expect(anna.assetStatus).toEqual({
      poseSprites: 'ready',
      bodyParts: 'shared child geometry with two-piece arms and two-piece shoed legs',
      faceParts: 'aligned full-head closed/open dialogue frames; expressions use pose sprites',
    });
    expect(Object.keys(anna.poses)).toHaveLength(7);
  });
});
