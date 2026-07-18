/**
 * Minimal OpenRouter client, following the patterns proven in the user's
 * Chunky Chinese app: the user's own API key, browser-side calls, friendly
 * error messages, and the unified image API for illustrations.
 */

export interface AiModel {
  id: string;
  label: string;
}

export const STORY_MODELS: AiModel[] = [
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek V3' },
  { id: 'moonshotai/kimi-k2', label: 'Kimi K2' },
  { id: 'anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5' },
];

export const DEFAULT_STORY_MODEL = STORY_MODELS[0].id;

// OpenRouter does not currently serve FLUX models; Gemini flash-lite image is
// the cheapest good option (~$0.002/image). Swap this constant when FLUX lands.
export const BACKGROUND_IMAGE_MODEL = 'google/gemini-3.1-flash-lite-image';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 90_000;

export async function chatText(options: {
  apiKey: string;
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
}): Promise<string> {
  const payload = await request(options.apiKey, {
    model: options.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.8,
    max_tokens: 4000,
  });
  const text = payload.choices?.[0]?.message?.content;
  if (!text) throw new Error('The model returned an empty reply. Try again.');
  return text;
}

/** Returns a data: URL for the generated image. */
export async function generateImage(options: {
  apiKey: string;
  prompt: string;
}): Promise<string> {
  const payload = await request(options.apiKey, {
    model: BACKGROUND_IMAGE_MODEL,
    messages: [{ role: 'user', content: options.prompt }],
    modalities: ['image', 'text'],
  });
  const url = payload.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (typeof url !== 'string' || !url.startsWith('data:image')) {
    throw new Error('OpenRouter did not return an image. Try again.');
  }
  return url;
}

interface OpenRouterPayload {
  choices?: Array<{
    message?: {
      content?: string;
      images?: Array<{ image_url?: { url?: string } }>;
    };
  }>;
  error?: { message?: string };
}

async function request(apiKey: string, body: object): Promise<OpenRouterPayload> {
  if (!apiKey) throw new Error('Add your OpenRouter API key in your account settings first.');

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer':
          typeof location !== 'undefined'
            ? location.origin + import.meta.env.BASE_URL
            : 'https://story-sprout.local/',
        'X-Title': 'Story Sprout',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new Error('The AI request timed out. Try again.', { cause: error });
    }
    throw new Error('Could not reach openrouter.ai. Check your internet connection.', { cause: error });
  }

  if (!response.ok) throw new Error(describeHttpError(response.status));

  let payload: OpenRouterPayload;
  try {
    payload = (await response.json()) as OpenRouterPayload;
  } catch {
    throw new Error('OpenRouter returned an unreadable response. Try again.');
  }
  if (payload.error?.message) throw new Error(`OpenRouter error: ${payload.error.message}`);
  return payload;
}

function describeHttpError(status: number): string {
  if (status === 401 || status === 403) {
    return 'OpenRouter rejected your API key. Check it in your account settings.';
  }
  if (status === 402) return 'Your OpenRouter account is out of credits.';
  if (status === 429) return 'Rate limited by OpenRouter. Wait a moment and try again.';
  return `OpenRouter request failed (HTTP ${status}).`;
}
