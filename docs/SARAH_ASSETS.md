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
  parts/                   reserved for matching layered artwork
  face/                    reserved for matching face shapes
```

The browser loads only the transparent files in `poses/`. Reference sheets are
kept so crops are reproducible and future art can be checked against the
original generation.

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

Walk/run remain stage translation with a small bob. Nod, shake, jump, wave,
tremble, recoil, and cry use restrained whole-body motion. A missing image logs
one warning and retains the previous clean pose; it never breaks story
playback.

## Pivots, layers, and debug view

The manifest records the intended future layer order and normalized starter
pivots. Turn on **Rig debug** under the stage to show Sarah's actor bounds,
shoulder/hip pivot guides, layer-order label, and current animation. Tune the
manifest first when matching separated parts are introduced, then position
each nested image around those anchors. Keep arms behind the vest/torso and use
generous shoulder, elbow, wrist, hip, knee, and ankle overlap.

## Current asset gap

The supplied separated-parts sheet is useful as construction reference, but
its Sarah wears a plain pink T-shirt and has a different face/hair rendering.
The polished full-body and pose sheets show the requested pink vest over a
light-pink shirt. Mixing them would make Sarah change design during animation,
so `parts/` and `face/` are deliberately reserved rather than populated with
inconsistent crops.

As a result, Sarah currently uses expression pose sprites and subtle talking
motion. Per-eye blinking and mouth-flap swaps are not enabled yet. To add them,
generate a new transparent parts/face sheet that exactly matches the pink-vest
model, then crop those shapes into `parts/` and `face/` and update
`character.json`. No `.story`, parser, validator, or director changes are
needed.
