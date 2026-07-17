import { createClient, type Session, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export interface AuthState {
  configured: boolean;
  session: Session | null;
  user: User | null;
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export async function getAuthState(): Promise<AuthState> {
  if (!supabase) return { configured: false, session: null, user: null };
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return {
    configured: true,
    session: data.session,
    user: data.session?.user ?? null,
  };
}

export function onAuthChange(callback: (state: AuthState) => void): () => void {
  if (!supabase) {
    callback({ configured: false, session: null, user: null });
    return () => undefined;
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback({
      configured: true,
      session,
      user: session?.user ?? null,
    });
  });
  return () => data.subscription.unsubscribe();
}

export async function signInWithGoogle(): Promise<void> {
  if (!supabase) throw new Error('Sign-in is not configured yet.');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: authRedirectUrl() },
  });
  if (error) throw error;
}

export async function sendMagicLink(email: string): Promise<void> {
  if (!supabase) throw new Error('Sign-in is not configured yet.');
  const trimmed = email.trim();
  if (!trimmed) throw new Error('Enter your email address first.');
  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      emailRedirectTo: authRedirectUrl(),
      shouldCreateUser: true,
    },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function invokeCharacterTts(body: unknown, signal?: AbortSignal): Promise<Blob> {
  if (!supabase || !supabaseUrl || !supabasePublishableKey) {
    throw new Error('Sign in is not configured yet.');
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('Sign in to hear character voices.');

  const response = await fetch(`${supabaseUrl}/functions/v1/character-tts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabasePublishableKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: unknown } | null;
    const message = typeof payload?.error === 'string' ? payload.error : 'Character voice generation failed.';
    throw new Error(message);
  }
  return response.blob();
}

export function authErrorFromUrl(): string | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const message = params.get('error_description') ?? params.get('error');
  if (!message) return null;
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  return message.replace(/\+/g, ' ');
}

function authRedirectUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
}
