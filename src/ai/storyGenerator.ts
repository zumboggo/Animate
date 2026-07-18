import type { Cast, StoryError } from '../engine/storyTypes';
import { ACTION_PHRASES, EMOTIONS, compileStory } from '../engine/validator';
import { chatText } from './openRouter';

export type StoryLanguage = 'english' | 'chinese' | 'bilingual';
export type StoryLength = 'short' | 'medium' | 'long';

export interface GenerateStoryOptions {
  apiKey: string;
  model: string;
  /** What the story should be about (may be empty — the model invents one). */
  prompt: string;
  /** Cast keys to feature (e.g. ['ANNA', 'SARAH']). */
  characters: string[];
  language: StoryLanguage;
  length: StoryLength;
  /** Scene names the script may use (built-ins + the user's generated library). */
  scenes: string[];
  cast: Cast;
}

export interface GeneratedStory {
  script: string;
  title: string;
  /** The `# setting:` visual description, used to paint a background. */
  setting?: string;
  /** Compile errors remaining after the fix round-trips (empty on success). */
  errors: StoryError[];
}

const LENGTH_LINES: Record<StoryLength, number> = { short: 12, medium: 22, long: 34 };

const CHARACTER_PERSONAS: Record<string, string> = {
  ANNA: 'the older sister — kind, a little bossy, takes charge',
  SARAH: 'the little sister — silly, fearless, loves surprises',
  GRACE: 'the cat lover — curious and giggly',
  ELLIOTT: 'the adventurer — brave, dramatic, always has a plan',
  LEAH: 'the baby sister — cannot talk yet; she toddles, dances, claps, and falls over adorably (give her actions, not dialogue)',
};

/** The chat function is injectable so tests can run without the network. */
type ChatFn = typeof chatText;

export async function generateStoryScript(
  options: GenerateStoryOptions,
  chat: ChatFn = chatText,
): Promise<GeneratedStory> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: buildSystemPrompt(options) },
    { role: 'user', content: buildUserMessage(options) },
  ];

  let script = cleanScript(await chat({ apiKey: options.apiKey, model: options.model, messages }));
  let errors = compile(script, options);

  // Give the model up to two chances to repair its own mistakes, with the
  // engine's real line-numbered errors as feedback.
  for (let attempt = 0; attempt < 2 && errors.length > 0; attempt++) {
    messages.push({ role: 'assistant', content: script });
    messages.push({
      role: 'user',
      content:
        'That script has problems the player cannot perform:\n' +
        errors.map((e) => `Line ${e.line}: ${e.message}`).join('\n') +
        '\n\nReturn the corrected COMPLETE script (every line, not just the fixes). Output only the script.',
    });
    const retry = cleanScript(
      await chat({ apiKey: options.apiKey, model: options.model, messages, temperature: 0.4 }),
    );
    const retryErrors = compile(retry, options);
    if (retryErrors.length <= errors.length) {
      script = retry;
      errors = retryErrors;
    }
  }

  return {
    script,
    title: extractTitle(script),
    setting: extractSetting(script),
    errors,
  };
}

function compile(script: string, options: GenerateStoryOptions): StoryError[] {
  return compileStory(script, {
    characters: Object.keys(options.cast),
    scenes: options.scenes,
  }).errors;
}

export function buildSystemPrompt(options: GenerateStoryOptions): string {
  const verbs = Object.keys(ACTION_PHRASES).join(', ');
  const castLines = options.characters
    .map((name) => {
      const displayName = options.cast[name]?.displayName ?? name;
      const persona = CHARACTER_PERSONAS[name] ?? '';
      return `- ${name} (${displayName})${persona ? `: ${persona}` : ''}`;
    })
    .join('\n');

  return [
    'You write short, funny animated stories for children, as scripts in a strict plain-text format.',
    'Output ONLY the script — no markdown fences, no commentary.',
    '',
    'FORMAT — one command per line:',
    'Line 1: `title: <story title>`',
    'Line 2: `# setting: <one-line visual description of the location, for a background painting>`',
    'Line 3: `scene: <scene name>`',
    'Then story lines:',
    '- Dialogue: `NAME: text` or `NAME (emotion): text`',
    '- Action: `NAME <action verb>` (e.g. `ANNA walks in from left`, `SARAH jumps`)',
    '- Expression only: `NAME (emotion)`',
    '- Pause: `wait 1s`',
    '- Effects: `screen shakes`, `camera zooms on NAME`, `camera resets`, `fade to black`, `fade in`',
    '',
    `CHARACTERS (use ONLY these, by their uppercase script name):\n${castLines}`,
    '',
    `ACTION VERBS (use ONLY these): ${verbs}`,
    'Movement verbs take directions: `from left`, `from right`, `to left`, `to center`, `to right`, `to far left`, `to far right`.',
    `EMOTIONS (use ONLY these): ${EMOTIONS.join(', ')}`,
    `SCENE NAMES (use ONLY these): ${options.scenes.join(', ')}`,
    '',
    'RULES:',
    '- Every character must walk or run in before doing anything, and characters at different positions (spread them out).',
    '- Lots of physical comedy: falls, jumps, dances, trembles. End on a happy beat.',
    '- Keep dialogue lines short (under 12 words).',
    languageRules(options.language),
  ].join('\n');
}

function languageRules(language: StoryLanguage): string {
  switch (language) {
    case 'english':
      return '- All dialogue in simple English a 5-year-old understands.';
    case 'chinese':
      return '- All dialogue in simple Mandarin Chinese (HSK 1-2 level), using 汉字.';
    case 'bilingual':
      return [
        '- Dialogue is bilingual for a child learning Chinese: each Chinese line is IMMEDIATELY followed by the same speaker saying the English translation as a separate dialogue line.',
        '  Example:\n  ANNA (happy): 你好！\n  ANNA: Hello!',
        '- Keep the Chinese at HSK 1-2 level.',
      ].join('\n');
  }
}

export function buildUserMessage(options: GenerateStoryOptions): string {
  const lines = LENGTH_LINES[options.length];
  return [
    options.prompt.trim()
      ? `Story request: ${options.prompt.trim()}`
      : 'Story request: invent a funny little adventure these characters would love.',
    `Feature these characters: ${options.characters.join(', ')}.`,
    `The script should be roughly ${lines} command lines (not counting title/setting/scene).`,
  ].join('\n');
}

/** Strips markdown fences and stray leading prose the model might add. */
export function cleanScript(raw: string): string {
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```[a-zA-Z]*\s*/, '').replace(/```\s*$/, '').trim();
  }
  const titleIdx = text.indexOf('title:');
  if (titleIdx > 0) text = text.slice(titleIdx);
  return text.trim();
}

export function extractTitle(script: string): string {
  const match = script.match(/^title:\s*(.+)$/m);
  return match?.[1].trim() ?? 'Untitled Story';
}

export function extractSetting(script: string): string | undefined {
  const match = script.match(/^#\s*setting:\s*(.+)$/im);
  return match?.[1].trim() || undefined;
}

/** Points the script's first `scene:` line at a newly generated background. */
export function replaceSceneLine(script: string, sceneName: string): string {
  if (/^scene:/m.test(script)) {
    return script.replace(/^scene:.*$/m, `scene: ${sceneName}`);
  }
  // No scene line at all: insert one after the title.
  return script.replace(/^(title:.*$)/m, `$1\nscene: ${sceneName}`);
}
