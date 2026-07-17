import './style.css';
import { Narrator } from './audio/narrator';
import { Director } from './engine/director';
import { SCENE_NAMES, Stage } from './engine/stage';
import type { Cast } from './engine/storyTypes';
import { compileStory } from './engine/validator';
import { BubbleLayer } from './ui/bubbles';
import { buildControls } from './ui/controls';
import { DialogueBox } from './ui/dialogueBox';
import { ErrorOverlay } from './ui/errorOverlay';
import { buildAuth } from './ui/auth';
import { buildScriptEditor, type ScriptEditor } from './ui/scriptEditor';
import castJson from '../stories/cast.json';

const DRAFT_KEY = 'story-sprout-draft';
const cast = castJson as unknown as Cast;

const storyModules = import.meta.glob('../stories/*.story', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const examples = new Map<string, string>();
for (const [path, source] of Object.entries(storyModules)) {
  const name = path.match(/([^/\\]+)\.story$/)?.[1] ?? path;
  examples.set(name, source);
}

const fallbackStory = `title: A Tiny Adventure
scene: park

ANNA walks in from left
ANNA (happy): Come on, Sarah!
SARAH runs in from right
SARAH waves
SARAH: Ready for an adventure?
ANNA dances
SARAH (laughing): Let's go!`;

const app = document.getElementById('app')!;
app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="#" aria-label="Story Sprout home">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i></span>
      <span>Story Sprout</span>
    </a>
    <div class="header-actions">
      <span class="header-note"><span></span> Your stories stay on this device</span>
      <div id="auth-root"></div>
    </div>
  </header>
  <main>
    <section class="hero">
      <span class="hero-kicker">A tiny animation studio</span>
      <h1>Make little stories <em>move.</em></h1>
      <p>Write a few simple lines, then watch Anna, Sarah, and their friends bring them to life.</p>
    </section>
    <div class="studio-grid" id="studio"></div>
    <section class="possibilities" aria-label="Story ideas">
      <span>Made for little moments</span>
      <p>Bedtime tales <i>·</i> Family adventures <i>·</i> Chinese practice <i>·</i> Silly surprises</p>
    </section>
  </main>
  <footer>Built for stories worth growing together.</footer>
`;

buildAuth(document.getElementById('auth-root')!);

const studio = document.getElementById('studio')!;
const previewPanel = document.createElement('section');
previewPanel.className = 'preview-panel studio-card';
previewPanel.setAttribute('aria-labelledby', 'preview-heading');
previewPanel.innerHTML = `
  <div class="panel-heading preview-heading">
    <div>
      <span class="eyebrow">Step 2 · Watch</span>
      <h2 id="preview-heading">Your animated story</h2>
      <p>Click the stage to move through the story.</p>
    </div>
    <span class="preview-badge"><i></i> Preview</span>
  </div>
`;

let initialSource = fallbackStory;
try {
  const savedDraft = localStorage.getItem(DRAFT_KEY);
  const usesRetiredExamples = savedDraft ? /\b(?:LIN|MAX|MEI)\b/.test(savedDraft) : false;
  initialSource = (!usesRetiredExamples ? savedDraft : null)
    ?? examples.get('sisters')
    ?? examples.values().next().value
    ?? fallbackStory;
} catch {
  initialSource = examples.get('sisters') ?? examples.values().next().value ?? fallbackStory;
}

let editor: ScriptEditor;
editor = buildScriptEditor(studio, [...examples.keys()].sort(), initialSource, cast, {
  onSubmit: (source) => playSource(source, true),
  onSourceChange: (source) => {
    saveDraft(source);
    return compileStory(source, compileOptions).errors;
  },
  onLoadExample: (name) => examples.get(name),
});
studio.appendChild(previewPanel);

const stageFrame = document.createElement('div');
stageFrame.className = 'stage-frame';
previewPanel.appendChild(stageFrame);
const stage = new Stage(stageFrame);
const bubbles = new BubbleLayer(stage.bubbleLayer, stage.el);
const dialogueBox = new DialogueBox(stage.el);
const errorOverlay = new ErrorOverlay(stage.el);
const narrator = new Narrator();

const castStrip = document.createElement('div');
castStrip.className = 'cast-strip';
const castLabel = document.createElement('span');
castLabel.textContent = 'On your stage';
castStrip.appendChild(castLabel);
const stageCast = Object.entries(cast)
  .filter(([, item]) => item.adapter === 'svgRig')
  .sort(([a], [b]) => {
    const order = ['ANNA', 'SARAH', 'GRACE', 'ELLIOTT', 'LEAH'];
    const aRank = order.indexOf(a);
    const bRank = order.indexOf(b);
    if (aRank !== -1 || bRank !== -1) return (aRank === -1 ? 99 : aRank) - (bRank === -1 ? 99 : bRank);
    return 0;
  });
for (const [name, entry] of stageCast) {
  const item = document.createElement('div');
  const dot = document.createElement('i');
  dot.className = `cast-dot ${name.toLowerCase()}`;
  dot.style.background = entry.appearance?.shirtColor ?? '#8d8fb5';
  const label = document.createElement('b');
  label.textContent = name;
  item.append(dot, label);
  castStrip.appendChild(item);
}
const sceneNames = document.createElement('span');
sceneNames.className = 'cast-scenes';
sceneNames.textContent = 'park · camp · bedroom · street · peppa-land';
castStrip.appendChild(sceneNames);
previewPanel.appendChild(castStrip);

let director: Director | null = null;
let lastPlayableSource = initialSource;
const compileOptions = { characters: Object.keys(cast), scenes: SCENE_NAMES };

function playSource(source: string, focusErrors: boolean): void {
  saveDraft(source);
  director?.dispose();
  director = null;
  errorOverlay.hide();
  stage.reset();

  const { story, errors } = compileStory(source, compileOptions);
  if (errors.length > 0) {
    errorOverlay.show('your story', errors, true);
    if (focusErrors) editor.setErrors(errors);
    else editor.setStatus('error', 'This draft needs a quick fix before it can play.');
    return;
  }

  lastPlayableSource = source;
  editor.setStatus('playing', `“${story.title}” is ready — click the preview to begin.`);
  director = new Director(story, cast, stage, bubbles, dialogueBox, narrator);
  void director.run();
}

function saveDraft(source: string): void {
  try {
    localStorage.setItem(DRAFT_KEY, source);
  } catch {
    // Draft persistence is a convenience; authoring still works without it.
  }
}

buildControls(previewPanel, {
  onRestart: () => playSource(lastPlayableSource, false),
});

stage.el.addEventListener('click', () => director?.advance());
window.addEventListener('keydown', (event) => {
  if (event.key !== ' ' && event.key !== 'Enter') return;
  const target = event.target as HTMLElement;
  if (target.matches('button, select, textarea, input') || target.isContentEditable) return;
  event.preventDefault();
  director?.advance();
});

playSource(initialSource, false);
