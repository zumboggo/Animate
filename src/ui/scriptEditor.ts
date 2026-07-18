import type { Cast, StoryError } from '../engine/storyTypes';
import { buildRigCharacter } from '../rig/svgCharacter';

export interface ScriptEditorCallbacks {
  onSubmit(source: string): void;
  onSourceChange(source: string): StoryError[];
  onLoadExample(name: string): string | undefined;
}

export interface ScriptEditor {
  setErrors(errors: StoryError[]): void;
  setStatus(kind: 'ready' | 'playing' | 'error', message: string): void;
  getSource(): string;
  setSource(source: string): void;
  /** Mount point for the AI generation section. */
  aiSlot: HTMLElement;
}

const INSERTIONS = [
  { label: 'Dialogue', value: (name: string) => `${name} (happy): Hello!` },
  { label: 'Walk in', value: (name: string) => `${name} walks in from left` },
  { label: 'Action', value: (name: string) => `${name} dances` },
  { label: 'Scene', value: () => 'scene: park' },
];

/** Builds the authoring side of the studio. The engine remains plain-text first. */
export function buildScriptEditor(
  parent: HTMLElement,
  examples: string[],
  initialSource: string,
  cast: Cast,
  cb: ScriptEditorCallbacks,
): ScriptEditor {
  const panel = document.createElement('section');
  panel.className = 'script-panel studio-card';
  panel.setAttribute('aria-labelledby', 'script-heading');

  const panelHead = document.createElement('div');
  panelHead.className = 'panel-heading';
  const headingCopy = document.createElement('div');
  const eyebrow = document.createElement('span');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'Step 1 · Write';
  const heading = document.createElement('h2');
  heading.id = 'script-heading';
  heading.textContent = 'Your story script';
  const helper = document.createElement('p');
  helper.textContent = 'One line can set a scene, make someone speak, or give them an action.';
  headingCopy.append(eyebrow, heading, helper);

  const guide = document.createElement('button');
  guide.className = 'text-button';
  guide.type = 'button';
  guide.textContent = 'Quick guide';
  guide.setAttribute('aria-expanded', 'false');
  panelHead.append(headingCopy, guide);

  const guidePanel = document.createElement('div');
  guidePanel.className = 'quick-guide';
  guidePanel.hidden = true;
  guidePanel.innerHTML = `
    <div><strong>Talk</strong><code>ANNA (happy): 你好！</code></div>
    <div><strong>Move</strong><code>SARAH walks in from left</code></div>
    <div><strong>Act</strong><code>ANNA waves</code></div>
    <div><strong>Set the scene</strong><code>scene: park</code></div>
    <p>Pick a character below, then use the line buttons. Scenes: <b>park</b>, <b>camp</b>, <b>bedroom</b>, <b>street</b>, <b>peppa-land</b></p>
  `;
  guide.addEventListener('click', () => {
    guidePanel.hidden = !guidePanel.hidden;
    guide.setAttribute('aria-expanded', String(!guidePanel.hidden));
  });

  const featuredOrder = ['ANNA', 'SARAH', 'GRACE', 'ELLIOTT', 'LEAH'];
  const selectableCast = Object.entries(cast)
    .filter(([, entry]) => entry.adapter === 'svgRig')
    .sort(([a], [b]) => {
      const aRank = featuredOrder.indexOf(a);
      const bRank = featuredOrder.indexOf(b);
      if (aRank !== -1 || bRank !== -1) return (aRank === -1 ? 99 : aRank) - (bRank === -1 ? 99 : bRank);
      return 0;
    });
  let selectedCharacter = selectableCast.find(([name]) => name === 'ANNA')?.[0]
    ?? selectableCast[0]?.[0]
    ?? 'ANNA';
  let insertLabel: HTMLSpanElement | undefined;

  const characterChooser = document.createElement('div');
  characterChooser.className = 'character-chooser';
  const characterLabel = document.createElement('span');
  characterLabel.className = 'field-label';
  characterLabel.textContent = 'Choose a character';
  const characterList = document.createElement('div');
  characterList.className = 'character-list';
  characterList.setAttribute('aria-label', 'Story characters');
  const characterButtons: HTMLButtonElement[] = [];

  for (const [name, entry] of selectableCast) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'character-card';
    button.dataset.character = name;
    button.setAttribute('aria-label', `Choose ${entry.displayName}`);
    button.setAttribute('aria-pressed', String(name === selectedCharacter));

    const portrait = document.createElement('span');
    portrait.className = 'character-portrait';
    const rig = buildRigCharacter(entry.appearance);
    rig.svg.setAttribute('aria-hidden', 'true');
    portrait.appendChild(rig.svg);
    const copy = document.createElement('span');
    copy.className = 'character-copy';
    const displayName = document.createElement('strong');
    displayName.textContent = entry.displayName;
    const descriptor = document.createElement('small');
    const descriptors: Record<string, string> = {
      ANNA: 'older sister',
      SARAH: 'little sister',
      GRACE: 'cat lover',
      ELLIOTT: 'adventurer',
      LEAH: 'baby sister',
    };
    descriptor.textContent = descriptors[name] ?? name;
    copy.append(displayName, descriptor);
    button.append(portrait, copy);
    button.classList.toggle('selected', name === selectedCharacter);
    button.addEventListener('click', () => {
      selectedCharacter = name;
      for (const candidate of characterButtons) {
        const selected = candidate.dataset.character === name;
        candidate.classList.toggle('selected', selected);
        candidate.setAttribute('aria-pressed', String(selected));
      }
      insertLabel!.textContent = `Add ${entry.displayName} line`;
    });
    characterButtons.push(button);
    characterList.appendChild(button);
  }
  characterChooser.append(characterLabel, characterList);

  const exampleRow = document.createElement('div');
  exampleRow.className = 'example-row';
  const exampleLabel = document.createElement('label');
  exampleLabel.htmlFor = 'example-picker';
  exampleLabel.textContent = 'Start from an example';
  const picker = document.createElement('select');
  picker.id = 'example-picker';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Choose a story…';
  picker.appendChild(placeholder);
  for (const name of examples) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name.replace(/-/g, ' ');
    picker.appendChild(option);
  }
  const load = document.createElement('button');
  load.type = 'button';
  load.className = 'secondary-button';
  load.textContent = 'Load';
  load.disabled = true;
  picker.addEventListener('change', () => (load.disabled = picker.value === ''));
  exampleRow.append(exampleLabel, picker, load);

  const editorShell = document.createElement('div');
  editorShell.className = 'editor-shell';
  const editorTop = document.createElement('div');
  editorTop.className = 'editor-topline';
  const fileName = document.createElement('span');
  fileName.textContent = 'my-story.story';
  const saved = document.createElement('span');
  saved.className = 'saved-state';
  saved.textContent = 'Saved locally';
  editorTop.append(fileName, saved);

  const textarea = document.createElement('textarea');
  textarea.className = 'script-input';
  textarea.value = initialSource;
  textarea.spellcheck = false;
  textarea.setAttribute('aria-label', 'Story script');
  textarea.setAttribute('aria-describedby', 'editor-feedback');

  const insertBar = document.createElement('div');
  insertBar.className = 'insert-bar';
  insertLabel = document.createElement('span');
  const selectedDisplayName = cast[selectedCharacter]?.displayName ?? selectedCharacter;
  insertLabel.textContent = `Add ${selectedDisplayName} line`;
  insertBar.appendChild(insertLabel);
  for (const insertion of INSERTIONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `+ ${insertion.label}`;
    button.addEventListener('click', () => insertLine(textarea, insertion.value(selectedCharacter)));
    insertBar.appendChild(button);
  }
  editorShell.append(editorTop, textarea, insertBar);

  const feedback = document.createElement('div');
  feedback.id = 'editor-feedback';
  feedback.className = 'editor-feedback';
  feedback.setAttribute('aria-live', 'polite');

  const actionRow = document.createElement('div');
  actionRow.className = 'editor-actions';
  const keyboardHint = document.createElement('span');
  keyboardHint.textContent = 'Ctrl + Enter';
  const submit = document.createElement('button');
  submit.type = 'button';
  submit.className = 'primary-button';
  submit.innerHTML = '<span>▶</span> Create animation';
  actionRow.append(keyboardHint, submit);

  const aiSlot = document.createElement('div');
  aiSlot.className = 'ai-slot';

  panel.append(panelHead, guidePanel, characterChooser, exampleRow, aiSlot, editorShell, feedback, actionRow);
  parent.appendChild(panel);

  let validationTimer = 0;
  textarea.addEventListener('input', () => {
    saved.textContent = 'Saving…';
    window.clearTimeout(validationTimer);
    validationTimer = window.setTimeout(() => {
      const errors = cb.onSourceChange(textarea.value);
      renderErrors(feedback, textarea, errors, false);
      saved.textContent = 'Saved locally';
    }, 260);
  });

  const submitStory = () => {
    window.clearTimeout(validationTimer);
    saved.textContent = 'Saved locally';
    cb.onSubmit(textarea.value);
  };
  submit.addEventListener('click', submitStory);
  textarea.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      submitStory();
    }
  });

  load.addEventListener('click', () => {
    const source = cb.onLoadExample(picker.value);
    if (source === undefined) return;
    textarea.value = source;
    textarea.focus();
    textarea.dispatchEvent(new Event('input'));
  });

  return {
    setErrors: (errors) => renderErrors(feedback, textarea, errors, true),
    setStatus: (kind, message) => renderStatus(feedback, kind, message),
    getSource: () => textarea.value,
    setSource: (source) => {
      textarea.value = source;
      textarea.dispatchEvent(new Event('input'));
    },
    aiSlot,
  };
}

function insertLine(textarea: HTMLTextAreaElement, line: string): void {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
  const suffix = after.length > 0 && !after.startsWith('\n') ? '\n' : '';
  textarea.setRangeText(`${prefix}${line}${suffix}`, start, end, 'end');
  textarea.focus();
  textarea.dispatchEvent(new Event('input'));
}

function renderStatus(
  parent: HTMLElement,
  kind: 'ready' | 'playing' | 'error',
  message: string,
): void {
  parent.className = `editor-feedback ${kind}`;
  parent.innerHTML = '';
  const icon = document.createElement('span');
  icon.className = 'feedback-icon';
  icon.textContent = kind === 'error' ? '!' : kind === 'playing' ? '▶' : '✓';
  const text = document.createElement('span');
  text.textContent = message;
  parent.append(icon, text);
}

function renderErrors(
  parent: HTMLElement,
  textarea: HTMLTextAreaElement,
  errors: StoryError[],
  focusFirst: boolean,
): void {
  if (errors.length === 0) {
    renderStatus(parent, 'ready', 'Script looks ready to animate.');
    return;
  }

  parent.className = 'editor-feedback error error-list';
  parent.innerHTML = '';
  const summary = document.createElement('strong');
  summary.textContent = `${errors.length} ${errors.length === 1 ? 'line needs' : 'lines need'} a quick fix`;
  parent.appendChild(summary);
  for (const error of errors.slice(0, 3)) {
    const button = document.createElement('button');
    button.type = 'button';
    const line = document.createElement('span');
    line.textContent = `Line ${error.line}`;
    button.append(line, document.createTextNode(error.message));
    button.addEventListener('click', () => focusLine(textarea, error.line));
    parent.appendChild(button);
  }
  if (focusFirst) focusLine(textarea, errors[0].line);
}

function focusLine(textarea: HTMLTextAreaElement, lineNumber: number): void {
  const lines = textarea.value.split('\n');
  let start = 0;
  for (let i = 1; i < lineNumber; i++) start += (lines[i - 1]?.length ?? 0) + 1;
  const end = start + (lines[lineNumber - 1]?.length ?? 0);
  textarea.focus();
  textarea.setSelectionRange(start, end);
}
