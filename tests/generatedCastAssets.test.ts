import { describe, expect, it } from 'vitest';
import elliott from '../public/assets/characters/elliott/character.json';
import grace from '../public/assets/characters/grace/character.json';
import leah from '../public/assets/characters/leah/character.json';
import cast from '../stories/cast.json';
import anna from '../public/assets/characters/anna/character.json';
import sarah from '../public/assets/characters/sarah/character.json';

const generatedCast = [
  ['GRACE', grace],
  ['ELLIOTT', elliott],
  ['LEAH', leah],
] as const;

describe('generated-art supporting cast', () => {
  it('uses the same hybrid two-piece rig system as Anna and Sarah', () => {
    for (const [name, manifest] of generatedCast) {
      expect(cast[name].adapter).toBe('puppetParts');
      expect(manifest.renderMode).toBe('hybrid');
      expect(Object.keys(manifest.rig.bones)).toHaveLength(12);
      expect(manifest.rig.layers).toHaveLength(name === 'ELLIOTT' ? 13 : name === 'GRACE' ? 10 : 12);
      expect(manifest.rig.talkingHead).toBe(true);
      expect(manifest.rig.layers.filter((layer) => layer.feature === 'headClosed')).toHaveLength(1);
      expect(manifest.rig.layers.filter((layer) => layer.feature === 'headOpen')).toHaveLength(1);
      expect(manifest.rig.bones).not.toHaveProperty('leftHand');
      expect(manifest.rig.bones).not.toHaveProperty('rightFoot');
    }
  });

  it('hides duplicate torso arms and closes Elliott\u2019s head-to-shirt gap', () => {
    expect(grace.rig.layers.find((layer) => layer.name === 'torso')?.asset).toContain('torso-clean-v2');
    expect(elliott.rig.layers.some((layer) => layer.name === 'neck')).toBe(true);
    expect(elliott.rig.layers.find((layer) => layer.name === 'torso')?.box[1]).toBeLessThan(30);
  });

  it('keeps the youngest arms restrained and Grace\u2019s illustrated head overlapped with her shirt', () => {
    const sarahUpperArm = cast.SARAH.assetManifest;
    expect(sarahUpperArm).toContain('?v=4');
    expect(leah.rig.layers.find((layer) => layer.name === 'left-upper-arm')?.box[2]).toBeLessThanOrEqual(13);
    expect(grace.rig.layers.find((layer) => layer.feature === 'headClosed')?.box[1]).toBeLessThan(0);
  });

  it('uses one shared main-cast skeleton and coherent everyday arms for Grace', () => {
    for (const manifest of [anna, sarah, grace, elliott]) {
      expect(manifest.rig.preset).toBe('episodeKid');
    }
    expect(grace.rig.armStyle).toBe('singlePiece');
    expect(grace.rig.layers.filter((layer) => layer.name.includes('arm-straight'))).toHaveLength(2);
    expect(grace.rig.layers.some((layer) => /upper-arm|forearm/.test(layer.name))).toBe(false);
    expect(grace.rig.armVariants.leftBent).toContain('left-arm-bent-v1.png');
    expect(grace.rig.armVariants.rightBent).toContain('right-arm-bent-v1.png');
  });

  it('ships seven coherent pose sprites for each character', () => {
    for (const [name, manifest] of generatedCast) {
      expect(Object.keys(manifest.poses)).toHaveLength(7);
      expect(cast[name].poseAssets).toMatchObject({
        sit: `assets/characters/${name.toLowerCase()}/poses/seated.png`,
        point: `assets/characters/${name.toLowerCase()}/poses/pointing.png`,
        laugh: `assets/characters/${name.toLowerCase()}/poses/laughing.png`,
        scared: `assets/characters/${name.toLowerCase()}/poses/scared.png`,
      });
      expect(Object.values(manifest.poses).every((pose) => pose.endsWith('.png'))).toBe(true);
    }
  });

  it('normalizes the four story actors while keeping Leah visibly younger', () => {
    expect(cast.LEAH.scale).toBeLessThan(cast.SARAH.scale);
    expect(new Set([cast.ANNA.scale, cast.SARAH.scale, cast.GRACE.scale, cast.ELLIOTT.scale])).toEqual(new Set([1]));
  });
});
