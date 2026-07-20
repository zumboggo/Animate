import { describe, expect, it } from 'vitest';
import { demoVoiceClipUrl } from '../src/audio/demoVoiceClips';
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

describe('bundled demo voices', () => {
  it('finds included English and Chinese dialogue but not new lines', () => {
    expect(demoVoiceClipUrl('ANNA\0happy\0Come on, Sarah! Let\'s find the flowers.')).toContain('/audio/demos/anna-');
    expect(demoVoiceClipUrl('GRACE\0happy\0你好！我是 Grace。')).toContain('/audio/demos/grace-');
    expect(demoVoiceClipUrl('ANNA\0neutral\0A brand new line')).toBeNull();
  });

  it('bundles every Grace and Elliott line from The Pancake Payback', () => {
    const pancakeLines = [
      'GRACE\0angry\0Elliott! You stole half of my pancakes!',
      'ELLIOTT\0confused\0I only wanted a little taste.',
      'GRACE\0angry\0Then I am taking three quarters of your pancakes!',
      'GRACE\0happy\0One bite, two bites, three bites. Delicious!',
      'ELLIOTT\0sad\0Now I only have one quarter left!',
      'GRACE\0laughing\0I am done eating. You have one quarter, and I still have half!',
    ];
    for (const key of pancakeLines) expect(demoVoiceClipUrl(key)).toMatch(/\/audio\/demos\/(grace|elliott)-.+\.wav$/);
  });
});
