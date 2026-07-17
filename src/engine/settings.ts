const STORAGE_KEY = 'animate-settings';

interface StoredSettings {
  autoplay: boolean;
  reduceMotion: boolean;
  lastStory?: string;
}

function load(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { autoplay: false, reduceMotion: false, ...JSON.parse(raw) };
  } catch {
    // Corrupt storage falls back to defaults.
  }
  return { autoplay: false, reduceMotion: false };
}

const state = load();

const mediaReduced =
  typeof window !== 'undefined' && 'matchMedia' in window
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode); settings just won't persist.
  }
}

export const settings = {
  get autoplay(): boolean {
    return state.autoplay;
  },
  set autoplay(value: boolean) {
    state.autoplay = value;
    persist();
  },

  /** True when the user's OS or the in-app toggle asks for reduced motion. */
  get reduceMotion(): boolean {
    return state.reduceMotion || (mediaReduced?.matches ?? false);
  },
  set reduceMotion(value: boolean) {
    state.reduceMotion = value;
    persist();
  },
  get reduceMotionToggle(): boolean {
    return state.reduceMotion;
  },

  get lastStory(): string | undefined {
    return state.lastStory;
  },
  set lastStory(value: string | undefined) {
    state.lastStory = value;
    persist();
  },
};
