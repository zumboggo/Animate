# Sarah generated-art integration

Sarah is the first generated-art character using the hybrid `puppetParts`
pipeline. Story syntax is unchanged: `SARAH points`, `SARAH sits`, emotional
dialogue, entrances, and all existing action verbs still go through the normal
director.

## Asset layout

```text
public/assets/characters/sarah/
  character.json          authoring manifest, layer order, starter pivots
  extraction-map.json     measured crop rectangles
  reference/
    fullbody.png
    pose-sheet.png
    parts-sheet.png
  poses/
    neutral.png
    happy.png
    angry.png
    scared.png
    seated.png
    pointing.png
    laughing.png
  parts/                   matching head, clothing, limbs, pelvis, and feet
  face/                    brows, eyes, and mouth expression shapes
```

The browser assembles the transparent files in `parts/` and `face/` for normal
acting, then crossfades to complete sprites in `poses/` for difficult actions.
Reference sheets are kept so every crop remains reproducible.

## Rebuild the pose crops

From the repository root:

```powershell
python scripts/extract_character_assets.py public/assets/characters/sarah/extraction-map.json
```

The script uses Pillow, NumPy, and SciPy. Crops are manual and stable; the
background cleanup flood-fills only bright neutral pixels connected to the crop
edge, then keeps the largest illustrated subject. Edit `rect` values in
`extraction-map.json` if a source sheet is replaced.

## Runtime mapping

`stories/cast.json` selects `adapter: "puppetParts"`, sets Sarah's scale to
`0.85`, and maps director poses to the transparent art. Standing poses are
full-height; scared/laughing/pointing are slightly reduced and seated is 0.68
of standing height so feet remain grounded rather than being enlarged to fill
the actor box.

Hard actions use the coherent full-body art:

- `sit` -> `seated.png`
- `point` -> `pointing.png`
- `laugh` and `dance` -> `laughing.png`
- `actScared` and scared/surprised dialogue -> `scared.png`
- angry dialogue and `handsOnHips` -> `angry.png`

Walk/run use stage translation, a small body bob, and restrained nested limb
motion. Nod, shake, jump, wave, tremble, recoil, and cry animate the layered
bone rig. Dialogue swaps real mouth shapes, and the eye layer blinks
independently. A missing image logs one warning and falls back to a clean pose;
it never breaks story playback.

## Pivots, layers, and debug view

The manifest drives the production layer order, normalized bone pivots, image
bounds, and face mappings. Turn on **Rig debug** under the stage to show every
bone pivot and part outline plus the live layer order. Keep arms behind the
vest/torso and use generous shoulder, elbow, wrist, hip, knee, and ankle
overlap when tuning it.

## Current production mode

The July 18 parts sheet matches Sarah's pink vest, light-pink sleeves, grey
pants, pigtails, and pink shoes. Those assets now power her hybrid renderer:
the bone rig handles continuous acting and face animation, while the seven
full-body sprites preserve polished silhouettes for seated, pointing,
laughing, scared, and other difficult poses. No `.story` syntax changed.
