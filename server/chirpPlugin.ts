import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { Plugin } from 'vite';

const GOOGLE_TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const MAX_TEXT_LENGTH = 1_000;

const PERSONAS: Record<string, { name: string; speakingRate: number }> = {
  ANNA: { name: 'Kore', speakingRate: 1.02 },
  SARAH: { name: 'Zephyr', speakingRate: 1.08 },
  GRACE: { name: 'Aoede', speakingRate: 1.04 },
  ELLIOTT: { name: 'Puck', speakingRate: 1.06 },
  LEAH: { name: 'Leda', speakingRate: 1.12 },
};

interface ChirpRequest {
  character?: unknown;
  text?: unknown;
}

function hasChinese(text: string): boolean {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(text);
}

function readBody(request: IncomingMessage): Promise<ChirpRequest> {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => {
      body += chunk;
      if (body.length > 20_000) reject(new Error('Request is too large.'));
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body) as ChirpRequest);
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });
    request.on('error', reject);
  });
}

function sendText(response: ServerResponse, status: number, message: string): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.end(message);
}

/** Same-origin development/preview proxy that keeps the Google API key private. */
export function chirpPlugin(apiKey: string | undefined): Plugin {
  const cache = new Map<string, Buffer>();
  const cacheDirectory = path.join(process.cwd(), '.cache', 'chirp');

  const middleware = async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    if (request.url?.split('?')[0] !== '/api/chirp') return next();
    if (request.method !== 'POST') return sendText(response, 405, 'Use POST for speech synthesis.');
    if (!apiKey) return sendText(response, 503, 'Google Chirp is not configured on this server.');

    try {
      const input = await readBody(request);
      const text = typeof input.text === 'string' ? input.text.trim() : '';
      const character = typeof input.character === 'string' ? input.character.toUpperCase() : '';
      if (!text) return sendText(response, 400, 'Dialogue text is required.');
      if (text.length > MAX_TEXT_LENGTH) return sendText(response, 400, 'Dialogue is too long to narrate.');

      const languageCode = hasChinese(text) ? 'cmn-CN' : 'en-US';
      const persona = PERSONAS[character] ?? { name: 'Zephyr', speakingRate: 1.0 };
      const cacheKey = createHash('sha256')
        .update(JSON.stringify({ languageCode, persona, text }))
        .digest('hex');
      const cacheFile = path.join(cacheDirectory, `${cacheKey}.mp3`);
      let audio = cache.get(cacheKey);

      if (!audio) {
        audio = await readFile(cacheFile).catch(() => undefined);
        if (audio) cache.set(cacheKey, audio);
      }

      if (!audio) {
        const googleResponse = await fetch(`${GOOGLE_TTS_URL}?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode,
              name: `${languageCode}-Chirp3-HD-${persona.name}`,
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: persona.speakingRate,
            },
          }),
        });
        const result = (await googleResponse.json()) as {
          audioContent?: string;
          error?: { message?: string };
        };
        if (!googleResponse.ok || !result.audioContent) {
          throw new Error(result.error?.message ?? 'Google could not synthesize this line.');
        }
        audio = Buffer.from(result.audioContent, 'base64');
        cache.set(cacheKey, audio);
        await mkdir(cacheDirectory, { recursive: true });
        await writeFile(cacheFile, audio);
      }

      response.statusCode = 200;
      response.setHeader('Content-Type', 'audio/mpeg');
      response.setHeader('Cache-Control', 'private, max-age=86400');
      response.end(audio);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Speech synthesis failed.';
      console.error('[chirp]', message);
      sendText(response, 502, message);
    }
  };

  return {
    name: 'story-sprout-chirp',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
