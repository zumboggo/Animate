# Animate 🎬

A script-driven 2D cartoon player, inspired by Episode Interactive's animation
studio. You write stories in a simple plain-text script — the characters act
them out on stage with bone-rigged animation, expressions, and speech bubbles.

```
title: The Spider
scene: park

LIN walks in from left
LIN (happy): What a beautiful day!
LIN sits

MAX runs in from right
MAX (scared): There's a spider on the bench!!
LIN jumps
LIN trembles
MAX laughs
```

## Running it

```bash
npm install
npm run dev      # opens the player at http://localhost:5173
npm test         # parser/validator test suite
```

Save any `.story` file in `stories/` and the page reloads with your changes.

## Writing stories

See **[docs/SCRIPTING.md](docs/SCRIPTING.md)** — the full author's guide:
every action (walk, sit, nod, tremble, dance, fall…), every emotion, scenes,
camera effects, and the friendly error messages you'll see when you typo.

Dialogue works in any language, including Chinese (a pinyin/dictionary
learning layer is planned — see the roadmap).

## How it works

```
.story text → parser → validator → director → character actors → animation adapter
                                                                   └─ SVG rig (built-in)
                                                                   └─ static sprite (fallback)
                                                                   └─ Spine / Live2D / sprite sheet / WebM (stubs, M3)
```

The story engine never talks to a specific animation technology — adapters do.
See **[docs/ANIMATION_ADAPTERS.md](docs/ANIMATION_ADAPTERS.md)** for the
developer guide and **[docs/ASSET_GUIDE.md](docs/ASSET_GUIDE.md)** for asset
conventions.

## Roadmap

- **M1 (done):** story player, SVG-rigged characters, actions, emotions,
  speech bubbles, autoplay, friendly script errors
- **M2:** more expressiveness, cast polish
- **M3:** pre-rigged / generated asset adapters
- **M4:** scenes & polish, AI-generated backgrounds, sound
- **M5:** choices & branching, Chinese-learning layer (pinyin, tap-a-word
  dictionary), narration
