import { settings } from '../engine/settings';
import { onAuthChange, supabase } from './supabase';

/**
 * Syncs AI settings (OpenRouter key, story model) with the signed-in user's
 * private `user_settings` row. The Supabase row is the source of truth;
 * localStorage (via `settings`) is a fast-start cache that is cleared on
 * sign-out, so AI generation is only available while signed in.
 */

export interface AiSettingsState {
  signedIn: boolean;
  openRouterApiKey: string;
  storyModel: string;
}

type Listener = (state: AiSettingsState) => void;

const listeners = new Set<Listener>();
let signedIn = false;

export function getAiSettings(): AiSettingsState {
  return {
    signedIn,
    openRouterApiKey: settings.openRouterApiKey,
    storyModel: settings.storyModel,
  };
}

export function onAiSettingsChange(listener: Listener): () => void {
  listeners.add(listener);
  listener(getAiSettings());
  return () => listeners.delete(listener);
}

function notify(): void {
  const state = getAiSettings();
  for (const listener of listeners) listener(state);
}

/** Call once at startup. Hydrates the cache on sign-in, clears it on sign-out. */
export function initUserSettingsSync(): void {
  onAuthChange((state) => {
    const nowSignedIn = Boolean(state.user);
    const wasSignedIn = signedIn;
    signedIn = nowSignedIn;

    if (!nowSignedIn) {
      if (wasSignedIn || settings.openRouterApiKey) {
        settings.openRouterApiKey = '';
      }
      notify();
      return;
    }

    void loadRemoteSettings().finally(notify);
  });
}

async function loadRemoteSettings(): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('user_settings')
    .select('openrouter_api_key, story_model')
    .maybeSingle();
  if (error) {
    console.warn('[animate] Could not load AI settings:', error.message);
    return;
  }
  if (!data) return;
  if (typeof data.openrouter_api_key === 'string') settings.openRouterApiKey = data.openrouter_api_key;
  if (typeof data.story_model === 'string' && data.story_model) settings.storyModel = data.story_model;
}

/** Saves to Supabase (upsert) and updates the local cache. Signed-in only. */
export async function saveAiSettings(partial: {
  openRouterApiKey?: string;
  storyModel?: string;
}): Promise<void> {
  if (!supabase) throw new Error('Sign-in is not configured yet.');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const user = sessionData.session?.user;
  if (!user) throw new Error('Sign in to save AI settings.');

  const row: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString() };
  if (partial.openRouterApiKey !== undefined) row.openrouter_api_key = partial.openRouterApiKey;
  if (partial.storyModel !== undefined) row.story_model = partial.storyModel;

  const { error } = await supabase.from('user_settings').upsert(row);
  if (error) throw new Error(`Could not save settings: ${error.message}`);

  if (partial.openRouterApiKey !== undefined) settings.openRouterApiKey = partial.openRouterApiKey;
  if (partial.storyModel !== undefined) settings.storyModel = partial.storyModel;
  notify();
}
