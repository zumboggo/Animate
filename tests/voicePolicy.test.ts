import { describe, expect, it } from 'vitest';
import { detectSpeechLanguage, emotionExaggeration, hasClonedVoice } from '../src/audio/voicePolicy';

describe('character voice policy', () => {
  it('only enables the four consented cloned voices', () => {
    for (const character of ['ANNA', 'SARAH', 'GRACE', 'ELLIOTT']) {
      expect(hasClonedVoice(character)).toBe(true);
    }
    expect(hasClonedVoice('LEAH')).toBe(false);
    expect(hasClonedVoice('NARRATOR')).toBe(false);
  });

  it('detects Mandarin dialogue', () => {
    expect(detectSpeechLanguage('你好，Anna！')).toBe('zh');
    expect(detectSpeechLanguage('Hello, Anna!')).toBe('en');
  });

  it('maps story emotions to restrained expressiveness', () => {
    expect(emotionExaggeration(undefined)).toBe(0.45);
    expect(emotionExaggeration('happy')).toBe(0.7);
    expect(emotionExaggeration('laughing')).toBe(0.7);
    expect(emotionExaggeration('surprised')).toBe(0.65);
    expect(emotionExaggeration('sad')).toBe(0.55);
    expect(emotionExaggeration('angry')).toBe(0.55);
  });
});
