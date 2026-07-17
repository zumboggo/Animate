import { settings } from '../engine/settings';

export interface SpeechLine {
  character: string;
  text: string;
}

/** Plays character dialogue returned by the server-side Google Chirp proxy. */
export class Narrator {
  private audio: HTMLAudioElement | null = null;
  private audioCache = new Map<string, Blob>();
  private pendingAudio = new Map<string, Promise<Blob>>();
  private request: AbortController | null = null;
  private finishPlayback: (() => void) | null = null;
  private finishBrowserSpeech: (() => void) | null = null;

  /** Generates every dialogue line in the background as soon as a story is valid. */
  prepare(lines: SpeechLine[]): void {
    if (!settings.voices || window.location.hostname.endsWith('github.io')) return;
    const queue = [...new Map(lines.map((line) => [this.keyFor(line), line])).values()]
      .filter((line) => !this.audioCache.has(this.keyFor(line)));

    const worker = async () => {
      while (queue.length > 0) {
        const line = queue.shift();
        if (!line) return;
        try {
          await this.fetchAudio(line);
        } catch {
          // Playback will retry and use the browser fallback if Chirp is unavailable.
        }
      }
    };
    void Promise.all([worker(), worker()]);
  }

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
      const blob = await this.fetchAudio(line);
      if (request.signal.aborted) return;
      const url = URL.createObjectURL(blob);
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

  private keyFor(line: SpeechLine): string {
    return `${line.character}\0${line.text}`;
  }

  private fetchAudio(line: SpeechLine): Promise<Blob> {
    const key = this.keyFor(line);
    const cached = this.audioCache.get(key);
    if (cached) return Promise.resolve(cached);
    const pending = this.pendingAudio.get(key);
    if (pending) return pending;

    const request = fetch('/api/chirp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(line),
      signal: AbortSignal.timeout(15_000),
    }).then(async (response) => {
      if (!response.ok) throw new Error(await response.text());
      const blob = await response.blob();
      this.audioCache.set(key, blob);
      return blob;
    }).finally(() => {
      this.pendingAudio.delete(key);
    });
    this.pendingAudio.set(key, request);
    return request;
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
      ANNA: { pitch: 1.16, rate: 1.02 },
      SARAH: { pitch: 1.3, rate: 1.08 },
      GRACE: { pitch: 1.2, rate: 1.04 },
      ELLIOTT: { pitch: 1.08, rate: 1.06 },
      LEAH: { pitch: 1.44, rate: 1.12 },
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
