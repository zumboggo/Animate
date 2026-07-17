import type { CharacterEmotion } from '../engine/storyTypes';

interface FaceSpec {
  browL: string;
  browR: string;
  mouth: string;
  mouthFilled?: boolean;
}

/**
 * Chibi face vocabulary. The big eyes never change — every emotion is
 * expressed with just the eyebrows and the mouth (plus tears for crying).
 * Head circle is centered at (100, 74) with r=56; eyes sit at x=78/122, y≈73;
 * brows hover around y≈46; the mouth lives around (100, 96..117).
 */
const FACES: Record<CharacterEmotion, FaceSpec> = {
  neutral: {
    browL: 'M66,49 Q78,44 90,49',
    browR: 'M110,49 Q122,44 134,49',
    mouth: 'M92,101 Q100,107 108,101',
  },
  happy: {
    browL: 'M66,45 Q78,40 90,45',
    browR: 'M110,45 Q122,40 134,45',
    mouth: 'M85,98 Q100,113 115,98',
  },
  sad: {
    browL: 'M66,52 Q78,50 90,46',
    browR: 'M110,46 Q122,50 134,52',
    mouth: 'M91,108 Q100,99 109,108',
  },
  angry: {
    browL: 'M66,44 L90,53',
    browR: 'M134,44 L110,53',
    mouth: 'M91,106 Q100,101 109,106',
  },
  scared: {
    browL: 'M66,41 Q78,35 90,41',
    browR: 'M110,41 Q122,35 134,41',
    mouth: 'M90,104 Q95,100 100,104 Q105,108 110,104',
  },
  surprised: {
    browL: 'M66,39 Q78,33 90,39',
    browR: 'M110,39 Q122,33 134,39',
    mouth: 'M100,97 a6.5,8 0 1 0 0.01,0 Z',
    mouthFilled: true,
  },
  laughing: {
    browL: 'M66,44 Q78,38 90,44',
    browR: 'M110,44 Q122,38 134,44',
    mouth: 'M84,97 Q100,95 116,97 Q114,117 100,117 Q86,117 84,97 Z',
    mouthFilled: true,
  },
  confused: {
    browL: 'M66,44 Q78,39 90,44',
    browR: 'M110,52 L134,52',
    mouth: 'M91,104 Q96,99 101,104 Q106,108 111,100',
  },
};

const TALK_MOUTH = 'M100,96 a7,9 0 1 0 0.01,0 Z';

export interface FaceElements {
  browL: SVGPathElement;
  browR: SVGPathElement;
  eyesOpen: SVGGElement;
  eyesClosed: SVGGElement;
  mouth: SVGPathElement;
  tears: SVGGElement;
  inkColor: string;
}

/**
 * Drives one character's face: brow/mouth emotion swaps, an occasional
 * blink, and a simple open/close mouth flap while the character speaks.
 */
export class FaceController {
  private emotion: CharacterEmotion = 'neutral';
  private blinkTimer: ReturnType<typeof setTimeout> | null = null;
  private talkTimer: ReturnType<typeof setInterval> | null = null;
  private talkOpen = false;

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
        this.setEyesClosed(true);
        setTimeout(() => this.setEyesClosed(false), 150);
        schedule();
      }, 2600 + Math.random() * 2600);
    };
    schedule();
  }

  stopBlinking(): void {
    if (this.blinkTimer) clearTimeout(this.blinkTimer);
    this.blinkTimer = null;
    this.setEyesClosed(false);
  }

  dispose(): void {
    this.stopBlinking();
    this.stopTalking();
  }

  private setEyesClosed(closed: boolean): void {
    this.els.eyesOpen.style.display = closed ? 'none' : '';
    this.els.eyesClosed.style.display = closed ? '' : 'none';
  }

  private apply(): void {
    const spec = FACES[this.emotion];
    this.els.browL.setAttribute('d', spec.browL);
    this.els.browR.setAttribute('d', spec.browR);
    this.applyMouth();
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
