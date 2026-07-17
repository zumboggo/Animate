import type { CharacterEmotion } from '../engine/storyTypes';

type EyeStyle = 'dots' | 'wide' | 'happyArcs' | 'closed';

interface FaceSpec {
  browL: string;
  browR: string;
  eyes: EyeStyle;
  mouth: string;
  mouthFilled?: boolean;
}

// Head circle is centered at (100, 68) with r=45; eyes sit at x=84/116, y≈64.
const FACES: Record<CharacterEmotion, FaceSpec> = {
  neutral: {
    browL: 'M75,51 Q84,47 93,51',
    browR: 'M107,51 Q116,47 125,51',
    eyes: 'dots',
    mouth: 'M91,89 Q100,93 109,89',
  },
  happy: {
    browL: 'M75,47 Q84,42 93,47',
    browR: 'M107,47 Q116,42 125,47',
    eyes: 'dots',
    mouth: 'M85,86 Q100,101 115,86',
  },
  sad: {
    browL: 'M75,53 Q84,51 93,47',
    browR: 'M107,47 Q116,51 125,53',
    eyes: 'dots',
    mouth: 'M90,95 Q100,86 110,95',
  },
  angry: {
    browL: 'M75,46 L93,54',
    browR: 'M125,46 L107,54',
    eyes: 'dots',
    mouth: 'M90,94 Q100,89 110,94',
  },
  scared: {
    browL: 'M75,44 Q84,39 93,44',
    browR: 'M107,44 Q116,39 125,44',
    eyes: 'wide',
    mouth: 'M91,92 Q95,88 99,92 Q103,96 107,92',
  },
  surprised: {
    browL: 'M75,43 Q84,38 93,43',
    browR: 'M107,43 Q116,38 125,43',
    eyes: 'wide',
    mouth: 'M100,86 a6,7.5 0 1 0 0.01,0 Z',
    mouthFilled: true,
  },
  laughing: {
    browL: 'M75,46 Q84,41 93,46',
    browR: 'M107,46 Q116,41 125,46',
    eyes: 'happyArcs',
    mouth: 'M84,85 Q100,84 116,85 Q114,105 100,105 Q86,105 84,85 Z',
    mouthFilled: true,
  },
  confused: {
    browL: 'M75,46 Q84,42 93,46',
    browR: 'M107,52 L125,52',
    eyes: 'dots',
    mouth: 'M91,93 Q96,88 101,93 Q105,96 110,90',
  },
};

const TALK_MOUTH = 'M100,85 a7,8.5 0 1 0 0.01,0 Z';

export interface FaceElements {
  browL: SVGPathElement;
  browR: SVGPathElement;
  eyeGroups: Record<EyeStyle, SVGGElement>;
  mouth: SVGPathElement;
  tears: SVGGElement;
  inkColor: string;
}

/**
 * Drives one character's face: emotion swaps, idle blinking, and a simple
 * open/close mouth flap while the character is speaking.
 */
export class FaceController {
  private emotion: CharacterEmotion = 'neutral';
  private blinkTimer: ReturnType<typeof setTimeout> | null = null;
  private talkTimer: ReturnType<typeof setInterval> | null = null;
  private talkOpen = false;
  private blinking = false;

  constructor(private els: FaceElements) {
    this.apply();
  }

  setEmotion(emotion: CharacterEmotion): void {
    this.emotion = emotion;
    this.apply();
  }

  getEmotion(): CharacterEmotion {
    return this.emotion;
  }

  startTalking(): void {
    if (this.talkTimer) return;
    this.talkTimer = setInterval(() => {
      this.talkOpen = !this.talkOpen;
      this.applyMouth();
    }, 150);
  }

  stopTalking(): void {
    if (this.talkTimer) clearInterval(this.talkTimer);
    this.talkTimer = null;
    this.talkOpen = false;
    this.applyMouth();
  }

  setTears(show: boolean): void {
    this.els.tears.style.display = show ? '' : 'none';
  }

  startBlinking(): void {
    if (this.blinkTimer) return;
    const schedule = () => {
      this.blinkTimer = setTimeout(() => {
        const spec = FACES[this.emotion];
        if (spec.eyes === 'dots' || spec.eyes === 'wide') {
          this.blinking = true;
          this.applyEyes();
          setTimeout(() => {
            this.blinking = false;
            this.applyEyes();
          }, 140);
        }
        schedule();
      }, 2600 + Math.random() * 2600);
    };
    schedule();
  }

  stopBlinking(): void {
    if (this.blinkTimer) clearTimeout(this.blinkTimer);
    this.blinkTimer = null;
    this.blinking = false;
    this.applyEyes();
  }

  dispose(): void {
    this.stopBlinking();
    this.stopTalking();
  }

  private apply(): void {
    const spec = FACES[this.emotion];
    this.els.browL.setAttribute('d', spec.browL);
    this.els.browR.setAttribute('d', spec.browR);
    this.applyEyes();
    this.applyMouth();
  }

  private applyEyes(): void {
    const spec = FACES[this.emotion];
    const active: EyeStyle = this.blinking ? 'closed' : spec.eyes;
    for (const [style, group] of Object.entries(this.els.eyeGroups)) {
      group.style.display = style === active ? '' : 'none';
    }
  }

  private applyMouth(): void {
    const spec = FACES[this.emotion];
    const open = this.talkOpen;
    this.els.mouth.setAttribute('d', open ? TALK_MOUTH : spec.mouth);
    const filled = open || spec.mouthFilled;
    this.els.mouth.setAttribute('fill', filled ? '#6e3038' : 'none');
    this.els.mouth.setAttribute('stroke', filled ? 'none' : this.els.inkColor);
  }
}
