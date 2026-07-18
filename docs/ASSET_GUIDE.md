# Asset Guide

## Backgrounds

V1 ships three built-in vector scenes (`park`, `bedroom`, `street`) plus the
image-backed `peppa-land` demo scene, all registered in `src/engine/stage.ts`.

In M3+, image backgrounds will live in `assets/backgrounds/` and be referenced
by file name from scripts:

```
assets/backgrounds/beach.jpg   →   scene: beach
```

Guidelines for background images:

- 16:9 (e.g. 1600×900 or 1920×1080), JPG or WebP.
- Leave the bottom ~25% visually calm — characters stand there.
- No people/characters baked into the art.

An optional generation script (`tools/gen-background.mjs`, M4) can create
these with Replicate or Imagen. API keys belong in `.env` (gitignored) and are
only ever read by Node scripts — never by browser code.

## Characters

Characters are defined in `stories/cast.json`. For the built-in SVG rig:

```json
{
  "LIN": {
    "displayName": "Lin",
    "adapter": "svgRig",
    "appearance": {
      "skin": "#f2c9a0",
      "hair": "short",          // short | curly | spiky | long | pigtails | sidePonytail | curlyPonytail | babyWisps
      "hairColor": "#2b1b12",
      "shirtColor": "#5aa9e6",
      "pantsColor": "#39415c",
      "outfit": "shirt",        // shirt | dress | onesie
      "dressColor": "#861d48",
      "pattern": "plain",       // plain | roses | stripes | cat | heart
      "eyeColor": "#5b4632",
      "freckles": false,
      "height": 1.0,             // relative size
      "build": "average"         // small | average | broad
    }
  }
}
```

The registry key (`LIN`) is the name used in scripts. `displayName` is what
speech bubbles show.

Sarah uses the generated-art `puppetParts` adapter in hybrid bone-and-pose mode. Her
production images and authoring manifest live under
`public/assets/characters/sarah/`; see [SARAH_ASSETS.md](SARAH_ASSETS.md) for
the extraction command, pose mapping, scale tuning, and current crop status.

Anna uses the same adapter with a complete matching source set. Her transparent
pose, body-part, and face assets live under `public/assets/characters/anna/`;
see [ANNA_ASSETS.md](ANNA_ASSETS.md) for regeneration and tuning details.

## Future pre-rigged / sprite assets

Organize per character under `assets/characters/`:

```
assets/characters/dragon/
  dragon.json        (Spine skeleton / Live2D model / sheet metadata)
  dragon.atlas
  dragon.png
```

Reference them from the cast entry via `asset`, and map engine actions to the
asset's animation names via `animationMap` (see ANIMATION_ADAPTERS.md).

## Audio (M4)

`assets/audio/` — sound effects and optional music. Not yet wired up.

## Licensing reminder

Only add third-party assets whose license allows your use (for a family
project, look for CC0/public-domain or similarly permissive licenses), and
keep a note of the source and license next to the files, e.g. an
`assets/characters/dragon/LICENSE.txt`.
