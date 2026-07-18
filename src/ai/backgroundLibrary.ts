import { supabase } from '../auth/supabase';
import { getSceneNames, registerImageScene } from '../engine/stage';
import { generateImage } from './openRouter';

const BUCKET = 'story-backgrounds';
const SIGNED_URL_SECONDS = 60 * 60 * 24 * 7;

/** Paints a 16:9 backdrop for a story setting. Returns a data: URL. */
export async function generateBackground(options: {
  apiKey: string;
  setting: string;
}): Promise<string> {
  const prompt = [
    `A 16:9 landscape background illustration for a children's cartoon: ${options.setting}.`,
    'Flat colors, simple friendly storybook style, soft daylight.',
    'IMPORTANT: no people, no animals, no characters, and no text or lettering.',
    'Keep the bottom quarter of the image simple and uncluttered (flat ground) so cartoon characters can stand there.',
  ].join(' ');
  return generateImage({ apiKey: options.apiKey, prompt });
}

/**
 * Uploads a generated background to the user's private scene library and
 * registers it as a usable scene. Returns the scene name for `scene:` lines.
 */
export async function saveBackground(dataUrl: string, settingHint: string): Promise<string> {
  if (!supabase) throw new Error('Sign-in is not configured yet.');
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) throw new Error('Sign in to save generated backgrounds.');

  const sceneName = uniqueSceneName(slugify(settingHint), getSceneNames());
  const { blob, extension } = dataUrlToBlob(dataUrl);
  const path = `${user.id}/${sceneName}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type,
    upsert: true,
  });
  if (error) throw new Error(`Could not save the background: ${error.message}`);

  // Register with the local data URL immediately — no need to round-trip.
  registerImageScene(sceneName, dataUrl);
  return sceneName;
}

/**
 * Loads the signed-in user's scene library and registers every background.
 * Returns the scene names that were registered.
 */
export async function loadBackgroundLibrary(): Promise<string[]> {
  if (!supabase) return [];
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return [];

  const { data: files, error } = await supabase.storage.from(BUCKET).list(user.id, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'asc' },
  });
  if (error) {
    console.warn('[animate] Could not list background library:', error.message);
    return [];
  }
  if (!files || files.length === 0) return [];

  const paths = files.map((f) => `${user.id}/${f.name}`);
  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (signError || !signed) {
    console.warn('[animate] Could not sign background URLs:', signError?.message);
    return [];
  }

  const names: string[] = [];
  for (const item of signed) {
    if (!item.signedUrl || !item.path) continue;
    const name = item.path.split('/').pop()?.replace(/\.[a-z0-9]+$/i, '');
    if (!name) continue;
    registerImageScene(name, item.signedUrl);
    names.push(name);
  }
  return names;
}

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('-');
  return slug || 'scene';
}

export function uniqueSceneName(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base;
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.includes(candidate)) return candidate;
  }
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; extension: string } {
  const match = dataUrl.match(/^data:(image\/(png|jpeg|webp));base64,(.+)$/);
  if (!match) throw new Error('The generated image had an unexpected format.');
  const [, mime, subtype, base64] = match;
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return { blob: new Blob([bytes], { type: mime }), extension: subtype === 'jpeg' ? 'jpg' : subtype };
}
