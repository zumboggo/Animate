import './style.css';
import { Director } from './engine/director';
import { settings } from './engine/settings';
import { SCENE_NAMES, Stage } from './engine/stage';
import type { Cast } from './engine/storyTypes';
import { compileStory } from './engine/validator';
import { BubbleLayer } from './ui/bubbles';
import { buildControls } from './ui/controls';
import { DialogueBox } from './ui/dialogueBox';
import { ErrorOverlay } from './ui/errorOverlay';
import castJson from '../stories/cast.json';

const cast = castJson as unknown as Cast;

// Every .story file in stories/ becomes a playable story. Vite reloads the
// page when one is saved, so authors see edits immediately.
const storyModules = import.meta.glob('../stories/*.story', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const stories = new Map<string, string>();
for (const [path, source] of Object.entries(storyModules)) {
  const name = path.match(/([^/\\]+)\.story$/)?.[1] ?? path;
  stories.set(name, source);
}

const app = document.getElementById('app')!;
const stage = new Stage(app);
const bubbles = new BubbleLayer(stage.bubbleLayer, stage.el);
const dialogueBox = new DialogueBox(stage.el);
const errorOverlay = new ErrorOverlay(stage.el);

const storyNames = [...stories.keys()].sort();
let currentStory =
  settings.lastStory && stories.has(settings.lastStory) ? settings.lastStory : storyNames[0];

let director: Director | null = null;

function playStory(name: string): void {
  currentStory = name;
  settings.lastStory = name;

  director?.dispose();
  director = null;
  errorOverlay.hide();
  stage.reset();

  const source = stories.get(name);
  if (source === undefined) {
    errorOverlay.show(name, [{ line: 1, message: 'Story file not found.' }]);
    return;
  }

  const { story, errors } = compileStory(source, {
    characters: Object.keys(cast),
    scenes: SCENE_NAMES,
  });
  if (errors.length > 0) {
    errorOverlay.show(name, errors);
    return;
  }

  director = new Director(story, cast, stage, bubbles, dialogueBox);
  void director.run();
}

buildControls(app, storyNames, currentStory, {
  onRestart: () => playStory(currentStory),
  onSelectStory: (name) => playStory(name),
});

stage.el.addEventListener('click', () => director?.advance());
window.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'SELECT') return;
    e.preventDefault();
    director?.advance();
  }
});

if (storyNames.length === 0) {
  errorOverlay.show('stories', [
    { line: 1, message: 'No .story files found in the stories/ folder. Create one to begin!' },
  ]);
} else {
  playStory(currentStory);
}
