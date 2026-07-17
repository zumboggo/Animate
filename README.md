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

## Sign-in setup

The studio supports Google sign-in and passwordless email magic links through
Supabase. Copy `.env.example` to `.env.local` and set the project URL and
publishable key. Never put a service-role or secret key in a `VITE_` variable.

In Supabase Authentication, enable the Google provider and add these redirect
URLs under **URL Configuration**:

```text
http://localhost:5173/**
https://your-production-domain.example/**
```

The local `.env.local` is ignored by Git. Signing in is optional; signed-out
visitors can still create and preview stories on their device.

## Character voices

Dialogue is narrated with distinct Google Cloud Chirp 3 HD voices for Anna,
Sarah, Mei, Lin, Max, and other characters. The player detects Chinese text and
uses a Mandarin voice automatically. Use **Voices on/off** below the stage to
control narration; the preference is saved in the browser.

Set `GOOGLE_CLOUD_API_KEY` as a server-side environment variable and enable the
Cloud Text-to-Speech API for that Google Cloud project. Do not rename it with a
`VITE_` prefix, because Vite-prefixed values are bundled into browser code. For
local development, the app also reads this key from the `.env` file one folder
above the project. The `/api/chirp` proxy works with `npm run dev` and
`npm run preview`; a production host must route that endpoint through a
server-side function using the same key.

## Using the story studio

The browser app now includes an authoring workspace, so you do not need to
create a file to try a story:

1. Write or paste a script into **Your story script**.
2. Use **Create animation** (or press Ctrl/Cmd + Enter).
3. Click the preview to advance the story, or turn on **Autoplay**.

Drafts are saved in the browser on the current device. The editor also includes
editable examples, quick-insert buttons, and line-specific help when a script
contains a typo. Files in `stories/` remain available as starting examples.

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
