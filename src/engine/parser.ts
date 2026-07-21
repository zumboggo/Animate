import type {
  EntrySide,
  ParseResult,
  RawCommand,
  StagePositionName,
  StoryError,
} from './storyTypes';

const POSITION_WORDS: Record<string, StagePositionName> = {
  'far left': 'farLeft',
  farleft: 'farLeft',
  left: 'left',
  center: 'center',
  centre: 'center',
  middle: 'center',
  right: 'right',
  shore: 'farRight',
  'far right': 'farRight',
  farright: 'farRight',
};

// Matches "NAME" optionally followed by "(emotion)". Names may be any
// non-space token so Chinese character names work too.
const NAME_PATTERN = /^(\S+?)\s*(?:\(([^)]*)\))?$/;

/**
 * Syntax-level pass: turns story text into raw commands plus friendly,
 * line-numbered errors. Semantic checks (does this character exist? is this
 * a real action?) happen in the validator.
 */
export function parseStory(source: string): ParseResult {
  const commands: RawCommand[] = [];
  const errors: StoryError[] = [];
  let title: string | undefined;

  const lines = source.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = i + 1;
    const text = lines[i].trim();

    if (text === '' || text.startsWith('#')) continue;

    // -- Reserved future syntax ------------------------------------------
    if (/^\[[^\]]*\]$/.test(text)) {
      errors.push({
        line,
        message: `Labels like "${text}" are coming soon! For now, stories play from top to bottom.`,
      });
      continue;
    }
    if (/^(choice|goto)\b/i.test(text)) {
      const word = text.split(/[\s:：]/)[0].toLowerCase();
      errors.push({
        line,
        message: `"${word}" is coming soon! For now, stories play from top to bottom without branching.`,
      });
      continue;
    }

    // -- Metadata ---------------------------------------------------------
    const meta = text.match(/^(title|scene)\s*[:：]\s*(.*)$/i);
    if (meta) {
      const key = meta[1].toLowerCase();
      const value = meta[2].trim();
      if (value === '') {
        errors.push({ line, message: `"${key}:" needs a value — for example "${key}: park".` });
        continue;
      }
      if (key === 'title') {
        title = value;
      } else {
        commands.push({ kind: 'scene', scene: value, line });
      }
      continue;
    }

    // -- Wait ---------------------------------------------------------------
    if (/^wait\b/i.test(text)) {
      const wait = text.match(/^wait\s+(\d+(?:\.\d+)?)\s*(ms|s)?$/i);
      if (!wait) {
        errors.push({
          line,
          message: `I couldn't read that wait time. Try "wait 2s" or "wait 500ms".`,
        });
        continue;
      }
      const value = parseFloat(wait[1]);
      const ms = (wait[2] ?? 's').toLowerCase() === 'ms' ? value : value * 1000;
      commands.push({ kind: 'wait', ms, line });
      continue;
    }

    // -- Stage / camera effects ----------------------------------------------
    const effect = parseEffect(text, line, errors);
    if (effect !== 'notEffect') {
      if (effect) commands.push(effect);
      continue;
    }

    // -- Dialogue: "NAME: text" or "NAME (emotion): text" ---------------------
    const colonIdx = firstColonIndex(text);
    if (colonIdx !== -1) {
      const head = text.slice(0, colonIdx).trim();
      const spoken = text.slice(colonIdx + 1).trim();
      const nameMatch = head.match(NAME_PATTERN);
      if (nameMatch) {
        if (spoken === '') {
          errors.push({
            line,
            message: `${nameMatch[1]} has nothing to say — add some words after the ":".`,
          });
          continue;
        }
        commands.push({
          kind: 'dialogue',
          character: nameMatch[1],
          emotion: cleanEmotion(nameMatch[2]),
          text: spoken,
          line,
        });
        continue;
      }
      // A colon mid-sentence that isn't dialogue falls through to action parsing.
    }

    // -- Expression / action: "NAME (emotion)? verb phrase?" -------------------
    const actionMatch = text.match(/^(\S+?)(?:\s*\(([^)]*)\))?(?:\s+(.*))?$/);
    if (!actionMatch) {
      errors.push({ line, message: `I couldn't understand this line: "${text}".` });
      continue;
    }

    const character = actionMatch[1];
    const emotion = cleanEmotion(actionMatch[2]);
    const phrase = (actionMatch[3] ?? '').trim();

    if (phrase === '') {
      if (emotion) {
        commands.push({ kind: 'expression', character, emotion, line });
      } else {
        errors.push({
          line,
          message: `"${character}" needs something to do — add an action like "${character} waves" or dialogue like "${character}: Hello!".`,
        });
      }
      continue;
    }

    const { verb, from, to } = extractDirections(phrase);
    if (verb === '') {
      errors.push({
        line,
        message: `I see a direction but no action — try "${character} walks to ${to ?? 'center'}".`,
      });
      continue;
    }
    commands.push({ kind: 'action', character, emotion, verb, from, to, line });
  }

  return { title, commands, errors };
}

function cleanEmotion(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim().toLowerCase();
  return trimmed ? trimmed : undefined;
}

/** Finds the first ASCII or full-width colon so Chinese punctuation works. */
function firstColonIndex(text: string): number {
  const a = text.indexOf(':');
  const b = text.indexOf('：');
  if (a === -1) return b;
  if (b === -1) return a;
  return Math.min(a, b);
}

/**
 * Pulls "from left/right" and "to <position>" out of an action phrase,
 * leaving the bare verb. Handles both orders ("walks in from left",
 * "walks from left to center").
 */
function extractDirections(phrase: string): {
  verb: string;
  from?: EntrySide;
  to?: StagePositionName;
} {
  let rest = phrase.toLowerCase().replace(/\s+/g, ' ');
  let from: EntrySide | undefined;
  let to: StagePositionName | undefined;

  const fromMatch = rest.match(/\bfrom (?:the )?(left|right)\b/);
  if (fromMatch) {
    from = fromMatch[1] as EntrySide;
    rest = (rest.slice(0, fromMatch.index) + rest.slice(fromMatch.index! + fromMatch[0].length)).trim();
  }

  const toMatch = rest.match(/\bto (?:the )?(far left|farleft|far right|farright|left|center|centre|middle|right|shore)\b/);
  if (toMatch) {
    to = POSITION_WORDS[toMatch[1]];
    rest = (rest.slice(0, toMatch.index) + rest.slice(toMatch.index! + toMatch[0].length)).trim();
  }

  return { verb: rest.replace(/\s+/g, ' ').trim(), from, to };
}

/**
 * Returns a command for recognized effects, null when the line looked like an
 * effect but was malformed (error already recorded), or 'notEffect'.
 */
function parseEffect(
  text: string,
  line: number,
  errors: StoryError[],
): RawCommand | null | 'notEffect' {
  const lower = text.toLowerCase().replace(/\s+/g, ' ');

  if (/^screen shakes?$/.test(lower)) return { kind: 'effect', effect: 'screenShake', line };
  if (/^fade to black$/.test(lower)) return { kind: 'effect', effect: 'fadeToBlack', line };
  if (/^fade in$/.test(lower)) return { kind: 'effect', effect: 'fadeIn', line };
  if (/^camera resets?$/.test(lower)) return { kind: 'effect', effect: 'cameraReset', line };

  const zoom = text.match(/^camera zooms?(?: in)? on (\S+)$/i);
  if (zoom) return { kind: 'effect', effect: 'cameraZoom', target: zoom[1], line };

  if (/^(screen|camera|fade)\b/.test(lower)) {
    errors.push({
      line,
      message:
        `I couldn't read that effect. Try "screen shakes", "camera zooms on NAME", ` +
        `"camera resets", "fade to black", or "fade in".`,
    });
    return null;
  }

  return 'notEffect';
}
