# Animation Adapters (developer guide)

The story engine never talks to a specific animation technology. It talks to
the `CharacterAnimationAdapter` interface, so the same script line can drive
an SVG rig today and a Spine or Live2D character later.

## The flow

```
.story text
   ↓  parser.ts        (syntax → raw commands, friendly errors)
   ↓  validator.ts     (vocabulary, typo suggestions → normalized StoryCommands)
   ↓  director.ts      (sequencing, pacing, dialogue pauses)
   ↓  characterActor.ts (stage state: on stage? sitting? auto-stand, auto-appear)
   ↓  CharacterAnimationAdapter   ← the boundary
   ↓  svgRigAdapter / staticSpriteAdapter / (spine, live2d, spriteSheet, webm)
```

`LIN nods` becomes `actor.perform({ action: 'nod', ... })` which becomes
`adapter.playAction('nod')`. What "nod" *looks like* is entirely the
adapter's business.

## The interface

See [`src/animation/animationTypes.ts`](../src/animation/animationTypes.ts).
The essentials:

```ts
interface CharacterAnimationAdapter {
  mount(container: HTMLElement): void;
  unmount(): void;
  setPosition(position, options?): Promise<void>;   // travel to a named spot
  setEmotion(emotion, options?): Promise<void>;
  playAction(action, options?): Promise<void>;
  enterFrom(side, to, gait): Promise<void>;
  exitTo(side, gait): Promise<void>;
  appearAt(position): void;                          // instant, no travel
  startIdle?/stopIdle?(): void;
  startTalking?/stopTalking?(): void;
  setFacing?(direction): void;
  getStageFraction(): number;                        // 0..1 across the stage
  getElement(): HTMLElement | null;                  // for bubble anchoring
}
```

Every `playAction` must **resolve** (the director awaits it) and must **never
throw** for an unsupported action — warn once and play a fallback (see
`warnOnce` and the bounce fallback in `svgRigAdapter.ts`).

## BaseAdapter does the boring parts

`adapters/baseAdapter.ts` implements mounting, stage travel (a CSS `left`
transition with speed based on distance and gait), entering/exiting via
offstage positions, facing flips, and reduced-motion fades. Subclasses:

1. implement `buildContent(inner)` — render your character into the wrapper,
2. implement `setEmotion` and `playAction`,
3. optionally override `onMoveStart(gait)` / `onMoveEnd()` to run a walk
   cycle while the wrapper travels.

## Adding a new adapter

1. Create `src/animation/adapters/myAdapter.ts` extending `BaseAdapter`.
2. Register a factory in `animationRegistry.ts`.
3. Use it from the cast: `"adapter": "myAdapter"` in `stories/cast.json`.

### Mapping engine actions to technology animation names

Pre-rigged assets (Spine, Live2D, sprite sheets, WebM) rarely name their
animations after our engine vocabulary. The cast entry carries the mapping:

```json
{
  "DRAGON": {
    "displayName": "Dragon",
    "adapter": "spine",
    "asset": "assets/characters/dragon/dragon.json",
    "animationMap": { "walkIn": "walk", "actScared": "fear", "laugh": "laugh" }
  }
}
```

Your adapter reads `entry.animationMap?.[action]`, falls back to a sensible
default, and warns once when nothing matches.

### Current adapter status

| Adapter | Status |
|---|---|
| `svgRig` | Full — bones, keyframe clips, faces, blinking, talking |
| `staticSprite` | Working fallback — one image, CSS-animated gestures |
| `spriteSheet` | Stub (behaves like staticSprite) — M3 |
| `webmClip` | Stub — M3 |
| `spine` | Stub — M3 |
| `live2d` | Stub — M3 |

## The SVG rig, briefly

- Skeleton (shared by all rig characters): `rig/svgSkeleton.ts` — nested SVG
  groups rotating around rest-pose pivots.
- Clips: `rig/clips/*.json` — normalized keyframes per bone
  (`rotate`/`tx`/`ty`). Author a clip once; every rig character can play it.
- Player: `rig/svgAnimator.ts` — smoothstep interpolation, pose blending on
  clip start, looping, `holdEnd` for poses like sitting.
- Faces: `rig/faces.ts` — brow/eye/mouth swaps per emotion, blinking, talk flap.

Add a new action by dropping a clip JSON in `rig/clips/`, registering it in
`clips/index.ts` and `ACTION_CLIPS` (svgRigAdapter), adding the verb to
`ACTION_PHRASES` (validator.ts) and the `CharacterAction` union
(storyTypes.ts).
