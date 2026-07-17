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

  async speak(line: SpeechLine): Promise<void> {
    this.stop();
    if (!settings.voices) return;

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
  }
}
