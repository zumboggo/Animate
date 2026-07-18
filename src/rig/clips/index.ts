import type { Clip } from '../svgAnimator';
import idle from './idle.json';
import walk from './walk.json';
import nod from './nod.json';
import shakeHead from './shakeHead.json';
import wave from './wave.json';
import jump from './jump.json';
import tremble from './tremble.json';
import sit from './sit.json';
import laugh from './laugh.json';
import cry from './cry.json';
import point from './point.json';
import dance from './dance.json';
import fall from './fall.json';
import bounce from './bounce.json';
import recoil from './recoil.json';
import treePose from './treePose.json';

export const CLIPS: Record<string, Clip> = {
  idle,
  walk,
  nod,
  shakeHead,
  wave,
  jump,
  tremble,
  sit,
  laugh,
  cry,
  point,
  dance,
  fall,
  bounce,
  recoil,
  treePose,
};
