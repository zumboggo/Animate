# Animate 🎬

A script-driven 2D cartoon player, inspired by Episode Interactive's animation
studio. You write stories in a simple plain-text script — the characters act
them out on stage with bone-rigged animation, expressions, and speech bubbles.

```
title: The Treat Spot Trees
scene: camp

GRACE walks in from left
GRACE (happy): The Treat Spot has ice cream!
ELLIOTT runs in from right
ANNA (happy): Quick—act like trees!
GRACE acts like a tree
ELLIOTT acts like a tree
ANNA acts like a tree
```

## Running it

```bash
npm install
npm run dev      # opens the player at http://localhost:5173
npm test         # parser/validator test suite
```

Public site: <https://zumboggo.github.io/Animate/>

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

The local `.env.local` is ignored by Git. Signed-out visitors can still create
and preview stories, but cloned character audio requires a signed-in session.

## Character voices

Anna, Sarah, Grace, and Elliott use consented private reference recordings with
Replicate's Chatterbox Multilingual model. Leah intentionally remains silent.
The player passes each script emotion to the voice service and detects Chinese
text automatically. Use **Voices on/off** below the stage to control narration.

The included demo stories ship with their finished dialogue as bundled audio
clips, so they play immediately even while signed out. Only new or edited story
lines call the authenticated generation service.

Before refreshing the bundled clips, run `node scripts/clean-voice-references.mjs`
to denoise the four ignored local references with Replicate's
`resemble-ai/resemble-enhance`, then run
`node scripts/generate-demo-audio.mjs --force`. Raw and cleaned reference files
remain under the Git-ignored `.cache/` directory.

Generation runs through the authenticated `character-tts` Supabase Edge
Function. Reference recordings and generated audio are stored in private
Storage buckets, and repeated dialogue uses the private cache instead of
spending more Replicate credits. The database limits each account to 60 new
lines per day. Chatterbox currently accepts up to 300 characters per line.

Set `REPLICATE_API_TOKEN` in Supabase Edge Function Secrets. Never put it in a
`VITE_` variable or commit voice recordings to this repository. Apply the
Supabase migration, upload the normalized WAV files as `anna.wav`, `sarah.wav`,
`grace.wav`, and `elliott.wav` to the `character-voice-references` bucket, then
deploy the function with JWT verification enabled.

## AI story generation

Signed-in users can generate stories with AI from the **✨ Write it with AI**
section of the studio: describe a story, pick which of the five characters
star in it, choose English / 中文 / Bilingual and a length, and the model
writes a script in the exact engine format (validated by the real parser,
with automatic fix round-trips). "Paint a background" also generates a 16:9
cartoon backdrop for the story's setting.

- Powered by **OpenRouter** with your own API key: add it under your account
  menu (top right). The key is stored in your private `user_settings` row
  (RLS-protected, synced across devices, cached locally, cleared from the
  device on sign-out) and sent only to openrouter.ai.
- Generated backgrounds upload to the private `story-backgrounds` Storage
  bucket and become a reusable scene library — any generated scene name can
  be used in future scripts.
- Apply `supabase/migrations/20260718090000_ai_story_generation.sql` before
  first use (`supabase db push` or run it in the dashboard SQL editor).

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
