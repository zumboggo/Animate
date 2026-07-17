import type { CharacterEmotion } from '../engine/storyTypes';

export const CLONED_VOICE_CHARACTERS = ['ANNA', 'SARAH', 'GRACE', 'ELLIOTT'] as const;

const CLONED_VOICE_SET = new Set<string>(CLONED_VOICE_CHARACTERS);

export function hasClonedVoice(character: string): boolean {
  return CLONED_VOICE_SET.has(character.toUpperCase());
}

export function detectSpeechLanguage(text: string): 'en' | 'zh' {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(text) ? 'zh' : 'en';
}

export function emotionExaggeration(emotion: CharacterEmotion | undefined): number {
  switch (emotion ?? 'neutral') {
    case 'happy':
    case 'laughing':
      return 0.7;
    case 'surprised':
      return 0.65;
    case 'sad':
    case 'angry':
    case 'scared':
    case 'confused':
      return 0.55;
    default:
      return 0.45;
  }
}
