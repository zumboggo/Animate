import { generateBackground, saveBackground } from '../ai/backgroundLibrary';
import { DEFAULT_STORY_MODEL } from '../ai/openRouter';
import {
  generateStoryScript,
  replaceSceneLine,
  type StoryLanguage,
  type StoryLength,
} from '../ai/storyGenerator';
import { getAiSettings, onAiSettingsChange } from '../auth/userSettings';
import type { Cast } from '../engine/storyTypes';

export interface AiPanelDeps {
  getScenes(): string[];
  /** Receives the finished script; should load it into the editor and play. */
  onScriptGenerated(script: string): void;
}

const LANGUAGES: Array<{ id: StoryLanguage; label: string }> = [
  { id: 'english', label: 'English' },
  { id: 'chinese', label: '中文' },
  { id: 'bilingual', label: 'Bilingual' },
];

const LENGTHS: Array<{ id: StoryLength; label: string }> = [
  { id: 'short', label: 'Short' },
  { id: 'medium', label: 'Medium' },
  { id: 'long', label: 'Long' },
];

/** The "✨ AI story" section inside the script editor panel. */
export function buildAiPanel(slot: HTMLElement, cast: Cast, deps: AiPanelDeps): void {
  const details = document.createElement('details');
  details.className = 'ai-panel';
  const summary = document.createElement('summary');
  summary.innerHTML = '<span aria-hidden="true">✨</span> Write it with AI';
  details.appendChild(summary);

  const body = document.createElement('div');
  body.className = 'ai-body';
  details.appendChild(body);
  slot.appendChild(details);

  const gate = document.createElement('p');
  gate.className = 'ai-gate';

  const form = document.createElement('div');
  form.className = 'ai-form';

  const promptLabel = document.createElement('label');
  promptLabel.className = 'field-label';
  promptLabel.htmlFor = 'ai-prompt';
  promptLabel.textContent = 'What should the story be about?';
  const prompt = document.createElement('textarea');
  prompt.id = 'ai-prompt';
  prompt.className = 'ai-prompt';
  prompt.rows = 2;
  prompt.placeholder = 'A picnic where the sandwiches keep disappearing…';

  const castLabel = document.createElement('span');
  castLabel.className = 'field-label';
  castLabel.textContent = 'Who is in it?';
  const castRow = document.createElement('div');
  castRow.className = 'ai-chip-row';
  const selected = new Set(Object.keys(cast).filter((name) => cast[name].adapter === 'svgRig'));
  for (const name of selected) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'ai-chip selected';
    chip.textContent = cast[name].displayName;
    chip.setAttribute('aria-pressed', 'true');
    chip.addEventListener('click', () => {
      const nowSelected = !selected.has(name);
      if (nowSelected) selected.add(name);
      else if (selected.size > 1) selected.delete(name);
      else return; // keep at least one character
      chip.classList.toggle('selected', selected.has(name));
      chip.setAttribute('aria-pressed', String(selected.has(name)));
    });
    castRow.appendChild(chip);
  }

  let language: StoryLanguage = 'english';
  const langRow = segmented(LANGUAGES, language, (value) => (language = value));
  let length: StoryLength = 'short';
  const lengthRow = segmented(LENGTHS, length, (value) => (length = value));

  const optionsRow = document.createElement('div');
  optionsRow.className = 'ai-options-row';
  const langWrap = labelled('Language', langRow);
  const lengthWrap = labelled('Length', lengthRow);
  const paintWrap = document.createElement('label');
  paintWrap.className = 'ai-paint-toggle';
  const paint = document.createElement('input');
  paint.type = 'checkbox';
  paint.checked = true;
  paintWrap.append(paint, document.createTextNode(' Paint a background'));
  optionsRow.append(langWrap, lengthWrap, paintWrap);

  const actionRow = document.createElement('div');
  actionRow.className = 'ai-action-row';
  const generate = document.createElement('button');
  generate.type = 'button';
  generate.className = 'primary-button';
  generate.innerHTML = '<span>✨</span> Generate story';
  const status = document.createElement('span');
  status.className = 'ai-status';
  status.setAttribute('aria-live', 'polite');
  actionRow.append(generate, status);

  form.append(promptLabel, prompt, castLabel, castRow, optionsRow, actionRow);
  body.append(gate, form);

  let busy = false;
  const refreshGate = () => {
    const state = getAiSettings();
    if (!state.signedIn) {
      gate.textContent = 'Sign in (top right) to generate stories with AI.';
      gate.hidden = false;
      form.hidden = true;
    } else if (!state.openRouterApiKey) {
      gate.textContent = 'Add your OpenRouter API key in your account menu to enable AI stories.';
      gate.hidden = false;
      form.hidden = true;
    } else {
      gate.hidden = true;
      form.hidden = false;
    }
  };
  onAiSettingsChange(refreshGate);

  generate.addEventListener('click', async () => {
    if (busy) return;
    const state = getAiSettings();
    if (!state.signedIn || !state.openRouterApiKey) {
      refreshGate();
      return;
    }

    busy = true;
    generate.disabled = true;
    status.classList.remove('error');
    try {
      status.textContent = 'Writing the story…';
      const result = await generateStoryScript({
        apiKey: state.openRouterApiKey,
        model: state.storyModel || DEFAULT_STORY_MODEL,
        prompt: prompt.value,
        characters: [...selected],
        language,
        length,
        scenes: deps.getScenes(),
        cast,
      });

      let script = result.script;
      let backgroundNote = '';
      if (paint.checked && result.setting) {
        try {
          status.textContent = 'Painting the background…';
          const dataUrl = await generateBackground({
            apiKey: state.openRouterApiKey,
            setting: result.setting,
          });
          const sceneName = await saveBackground(dataUrl, result.setting);
          script = replaceSceneLine(script, sceneName);
        } catch (error) {
          backgroundNote = ` (background skipped: ${message(error)})`;
        }
      }

      deps.onScriptGenerated(script);
      status.textContent =
        result.errors.length > 0
          ? `Done, but ${result.errors.length} line${result.errors.length === 1 ? '' : 's'} need a manual fix.`
          : `“${result.title}” is ready!${backgroundNote}`;
    } catch (error) {
      status.textContent = message(error);
      status.classList.add('error');
    } finally {
      busy = false;
      generate.disabled = false;
    }
  });
}

function segmented<T extends string>(
  options: Array<{ id: T; label: string }>,
  initial: T,
  onChange: (value: T) => void,
): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'ai-segmented';
  const buttons: HTMLButtonElement[] = [];
  for (const option of options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = option.label;
    button.classList.toggle('selected', option.id === initial);
    button.setAttribute('aria-pressed', String(option.id === initial));
    button.addEventListener('click', () => {
      onChange(option.id);
      for (const other of buttons) {
        const isSelected = other === button;
        other.classList.toggle('selected', isSelected);
        other.setAttribute('aria-pressed', String(isSelected));
      }
    });
    buttons.push(button);
    row.appendChild(button);
  }
  return row;
}

function labelled(text: string, control: HTMLElement): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'ai-labelled';
  const label = document.createElement('span');
  label.className = 'field-label';
  label.textContent = text;
  wrap.append(label, control);
  return wrap;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.';
}
