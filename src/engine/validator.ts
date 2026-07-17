import { parseStory } from './parser';
import type {
  CharacterAction,
  CharacterEmotion,
  Story,
  StoryCommand,
  StoryError,
} from './storyTypes';

interface ActionSpec {
  action: CharacterAction;
  gait?: 'walk' | 'run';
  /** Some actions imply a facial expression (e.g. laughing). */
  impliedEmotion?: CharacterEmotion;
}

/** Natural-language verb phrases → engine actions. Keys are lowercase. */
export const ACTION_PHRASES: Record<string, ActionSpec> = {
  'walks in': { action: 'walkIn' },
  'walk in': { action: 'walkIn' },
  enters: { action: 'walkIn' },
  'comes in': { action: 'walkIn' },
  'runs in': { action: 'runIn', gait: 'run' },
  'run in': { action: 'runIn', gait: 'run' },
  'walks out': { action: 'walkOut' },
  'walk out': { action: 'walkOut' },
  leaves: { action: 'walkOut' },
  exits: { action: 'walkOut' },
  'runs out': { action: 'runOut', gait: 'run' },
  'run out': { action: 'runOut', gait: 'run' },
  sits: { action: 'sit' },
  sit: { action: 'sit' },
  'sits down': { action: 'sit' },
  stands: { action: 'stand' },
  stand: { action: 'stand' },
  'stands up': { action: 'stand' },
  'gets up': { action: 'stand' },
  nods: { action: 'nod' },
  nod: { action: 'nod' },
  'nods head': { action: 'nod' },
  'shakes head': { action: 'shakeHead' },
  'shake head': { action: 'shakeHead' },
  'shakes his head': { action: 'shakeHead' },
  'shakes her head': { action: 'shakeHead' },
  'shakes their head': { action: 'shakeHead' },
  waves: { action: 'wave' },
  wave: { action: 'wave' },
  'waves hand': { action: 'wave' },
  jumps: { action: 'jump' },
  jump: { action: 'jump' },
  hops: { action: 'jump' },
  trembles: { action: 'tremble' },
  tremble: { action: 'tremble' },
  shakes: { action: 'tremble' },
  shivers: { action: 'tremble' },
  'acts scared': { action: 'actScared', impliedEmotion: 'scared' },
  'act scared': { action: 'actScared', impliedEmotion: 'scared' },
  'is scared': { action: 'actScared', impliedEmotion: 'scared' },
  'acts like a tree': { action: 'treePose' },
  'act like a tree': { action: 'treePose' },
  'pretends to be a tree': { action: 'treePose' },
  'freezes like a tree': { action: 'treePose' },
  laughs: { action: 'laugh', impliedEmotion: 'laughing' },
  laugh: { action: 'laugh', impliedEmotion: 'laughing' },
  cries: { action: 'cry', impliedEmotion: 'sad' },
  cry: { action: 'cry', impliedEmotion: 'sad' },
  sobs: { action: 'cry', impliedEmotion: 'sad' },
  points: { action: 'point' },
  point: { action: 'point' },
  dances: { action: 'dance', impliedEmotion: 'happy' },
  dance: { action: 'dance', impliedEmotion: 'happy' },
  falls: { action: 'fall' },
  'falls down': { action: 'fall' },
  'falls over': { action: 'fall' },
  trips: { action: 'fall' },
  'turns around': { action: 'turnAround' },
  'turn around': { action: 'turnAround' },
};

export const EMOTIONS: CharacterEmotion[] = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'scared',
  'surprised',
  'laughing',
  'confused',
];

const EMOTION_SYNONYMS: Record<string, CharacterEmotion> = {
  mad: 'angry',
  afraid: 'scared',
  frightened: 'scared',
  shocked: 'surprised',
  glad: 'happy',
  excited: 'happy',
  puzzled: 'confused',
  worried: 'confused',
};

export interface CompileOptions {
  /** Canonical character names from the cast registry. */
  characters: string[];
  /** Known scene names. */
  scenes: string[];
}

export interface CompileResult {
  story: Story;
  errors: StoryError[];
}

/** Full pipeline: parse (syntax) then validate/normalize (semantics). */
export function compileStory(source: string, opts: CompileOptions): CompileResult {
  const parsed = parseStory(source);
  const errors: StoryError[] = [...parsed.errors];
  const commands: StoryCommand[] = [];

  const resolveCharacter = (name: string, line: number): string | undefined => {
    const found = opts.characters.find((c) => c.toLowerCase() === name.toLowerCase());
    if (found) return found;
    errors.push({
      line,
      message: withSuggestion(`Unknown character "${name}".`, name, opts.characters),
    });
    return undefined;
  };

  const resolveEmotion = (
    raw: string | undefined,
    line: number,
  ): CharacterEmotion | undefined => {
    if (!raw) return undefined;
    if ((EMOTIONS as string[]).includes(raw)) return raw as CharacterEmotion;
    if (EMOTION_SYNONYMS[raw]) return EMOTION_SYNONYMS[raw];
    errors.push({
      line,
      message: withSuggestion(`Unknown emotion "${raw}".`, raw, EMOTIONS),
    });
    return undefined;
  };

  for (const cmd of parsed.commands) {
    switch (cmd.kind) {
      case 'scene': {
        const found = opts.scenes.find((s) => s.toLowerCase() === cmd.scene.toLowerCase());
        if (!found) {
          errors.push({
            line: cmd.line,
            message: withSuggestion(`Unknown scene "${cmd.scene}".`, cmd.scene, opts.scenes),
          });
          break;
        }
        commands.push({ kind: 'scene', scene: found, line: cmd.line });
        break;
      }

      case 'dialogue': {
        const character = resolveCharacter(cmd.character, cmd.line);
        const emotion = resolveEmotion(cmd.emotion, cmd.line);
        if (!character) break;
        commands.push({ kind: 'dialogue', character, emotion, text: cmd.text, line: cmd.line });
        break;
      }

      case 'expression': {
        const character = resolveCharacter(cmd.character, cmd.line);
        const emotion = resolveEmotion(cmd.emotion, cmd.line);
        if (!character || !emotion) break;
        commands.push({ kind: 'expression', character, emotion, line: cmd.line });
        break;
      }

      case 'action': {
        const character = resolveCharacter(cmd.character, cmd.line);
        const emotion = resolveEmotion(cmd.emotion, cmd.line);
        if (!character) break;

        const spec = resolveAction(cmd.verb, cmd.from !== undefined, cmd.to !== undefined);
        if (typeof spec === 'string') {
          errors.push({ line: cmd.line, message: spec });
          break;
        }
        commands.push({
          kind: 'action',
          character,
          action: spec.action,
          emotion: emotion ?? spec.impliedEmotion,
          gait: spec.gait ?? 'walk',
          from: cmd.from,
          to: cmd.to,
          line: cmd.line,
        });
        break;
      }

      case 'wait':
        commands.push(cmd);
        break;

      case 'effect': {
        let target: string | undefined;
        if (cmd.target !== undefined) {
          target = resolveCharacter(cmd.target, cmd.line);
          if (!target) break;
        }
        commands.push({ kind: 'effect', effect: cmd.effect, target, line: cmd.line });
        break;
      }
    }
  }

  return { story: { title: parsed.title ?? 'Untitled Story', commands }, errors };
}

/** Returns an ActionSpec, or a friendly error message string. */
function resolveAction(verb: string, hasFrom: boolean, hasTo: boolean): ActionSpec | string {
  const spec = ACTION_PHRASES[verb];
  if (spec) {
    // "walks in" with a destination is fine; "sits to center" is nonsense but harmless.
    return spec;
  }

  // Bare "walks"/"runs" — meaning depends on the direction words present.
  if (verb === 'walks' || verb === 'walk') {
    if (hasTo) return { action: 'walkTo' };
    if (hasFrom) return { action: 'walkIn' };
    return `"walks" needs a direction — try "walks to center" or "walks in from left".`;
  }
  if (verb === 'runs' || verb === 'run') {
    if (hasTo) return { action: 'walkTo', gait: 'run' };
    if (hasFrom) return { action: 'runIn', gait: 'run' };
    return `"runs" needs a direction — try "runs to center" or "runs in from left".`;
  }

  return withSuggestion(
    `I don't know the action "${verb}".`,
    verb,
    Object.keys(ACTION_PHRASES),
  );
}

function withSuggestion(message: string, input: string, candidates: readonly string[]): string {
  const suggestion = suggest(input, candidates);
  return suggestion ? `${message} Did you mean "${suggestion}"?` : message;
}

/** Closest candidate by edit distance, if it's close enough to be a likely typo. */
export function suggest(input: string, candidates: readonly string[]): string | undefined {
  let best: string | undefined;
  let bestDist = Infinity;
  const needle = input.toLowerCase();
  for (const candidate of candidates) {
    const d = levenshtein(needle, candidate.toLowerCase());
    if (d < bestDist) {
      bestDist = d;
      best = candidate;
    }
  }
  const allowed = needle.length >= 8 ? 3 : 2;
  return bestDist <= allowed ? best : undefined;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}
