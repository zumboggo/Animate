import { settings } from '../engine/settings';

export interface SpeechLine {
  character: string;
  text: string;
}

/** Plays character dialogue returned by the server-side Google Chirp proxy. */
export class Narrator {
  private audio: HTMLAudioElement | null = null;
  private request: AbortController | null = null;
  private finishPlayback: (() => void) | null = null;
  private finishBrowserSpeech: (() => void) | null = null;

  async speak(line: SpeechLine): Promise<void> {
    this.stop();
    if (!settings.voices) return;

    // GitHub Pages is static and cannot keep a Google API key server-side.
    // Use the browser's installed voices there while retaining Chirp locally
    // and on hosts that provide the /api/chirp server function.
    if (window.location.hostname.endsWith('github.io')) {
      await this.speakWithBrowser(line);
      return;
    }

    const request = new AbortController();
    this.request = request;

    try {
      const response = await fetch('/api/chirp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(line),
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(12_000)]),
      });
      if (!response.ok) throw new Error(await response.text());

      const url = URL.createObjectURL(await response.blob());
      const audio = new Audio(url);
      this.audio = audio;
      await new Promise<void>((resolve) => {
        const finish = () => {
          URL.revokeObjectURL(url);
          if (this.audio === audio) this.audio = null;
          if (this.finishPlayback === finish) this.finishPlayback = null;
          resolve();
        };
        this.finishPlayback = finish;
        audio.addEventListener('ended', finish, { once: true });
        audio.addEventListener('error', finish, { once: true });
        void audio.play().catch(finish);
      });
    } catch (error) {
      if (!request.signal.aborted) {
        console.warn('[animate] Voice narration is unavailable:', error);
        await this.speakWithBrowser(line);
      }
    } finally {
      if (this.request === request) this.request = null;
    }
  }

  stop(): void {
    this.request?.abort();
    this.request = null;
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
      this.audio = null;
    }
    this.finishPlayback?.();
    this.finishPlayback = null;
    window.speechSynthesis?.cancel();
    this.finishBrowserSpeech?.();
    this.finishBrowserSpeech = null;
  }

  private speakWithBrowser(line: SpeechLine): Promise<void> {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      return Promise.resolve();
    }

    const profiles: Record<string, { pitch: number; rate: number }> = {
      ANNA: { pitch: 1.12, rate: 0.96 },
      SARAH: { pitch: 1.28, rate: 1.04 },
      GRACE: { pitch: 1.16, rate: 1.0 },
      ELLIOTT: { pitch: 0.96, rate: 1.02 },
      LEAH: { pitch: 1.42, rate: 1.08 },
    };
    const profile = profiles[line.character] ?? { pitch: 1, rate: 1 };
    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.lang = /[\u3400-\u9fff]/u.test(line.text) ? 'zh-CN' : 'en-US';
    utterance.pitch = profile.pitch;
    utterance.rate = profile.rate;
    const matchingVoice = window.speechSynthesis.getVoices().find((voice) =>
      voice.lang.toLowerCase().startsWith(utterance.lang.slice(0, 2).toLowerCase()),
    );
    if (matchingVoice) utterance.voice = matchingVoice;

    return new Promise((resolve) => {
      const finish = () => {
        if (this.finishBrowserSpeech === finish) this.finishBrowserSpeech = null;
        resolve();
      };
      this.finishBrowserSpeech = finish;
      utterance.addEventListener('end', finish, { once: true });
      utterance.addEventListener('error', finish, { once: true });
      window.speechSynthesis.speak(utterance);
    });
  }
}
