# Anna generated-art integration

Anna uses the same hybrid `puppetParts` contract as Sarah. Existing story
commands such as `ANNA points`, `ANNA sits`, emotional dialogue, entrances,
and movement still flow through the normal director without new syntax.

## Asset layout

```text
public/assets/characters/anna/
  character.json          layer order, pivot starters, and asset status
  extraction-map.json     manually measured reproducible crop rectangles
  reference/              original full-body, pose, and parts sheets
  poses/                  seven transparent full-body acting poses
  parts/                  head, hair, torso, limbs, pelvis, and feet
  face/                   brows, eyes, and mouth expression shapes
```

Rebuild every transparent crop from the repository root with:

```powershell
python scripts/extract_character_assets.py public/assets/characters/anna/extraction-map.json
```

The crop script removes only the warm near-white background connected to each
crop edge. It keeps the largest subject for body art and preserves paired eyes
or eyebrows while removing isolated sheet specks. Adjust only the measured
`rect` values when replacing a source sheet.

## Runtime mapping

`stories/cast.json` assigns Anna `adapter: "puppetParts"` at scale `1.0`; Sarah
remains `0.85`. Dialogue emotions crossfade among the neutral, happy, angry,
and scared sprites. Sit, point, laugh, and dance use their dedicated full-body
poses. Walk and run remain stage translation plus a restrained body bob, while
small actions use whole-body puppet-theatre motion.

Anna's extracted body and face parts match her red Canada top, heart-patterned
leggings, pink shoes, brown bob, and pink sunglasses. They are ready for future
joint-level assembly. The production renderer currently favors the complete
pose sprites because those guarantee clean shoulders and hips during difficult
actions.

## Pivots and debug tuning

`character.json` contains normalized starter pivots for shoulders, elbows,
wrists, hips, and knees plus the intended layer order. Use **Rig debug** below
the stage to inspect Anna's bounds, current pose, shoulder/hip guides, and layer
labels. When the layered rig is enabled, keep arms behind the shirt, place
shoulder pivots inside the torso, and preserve generous overlap at every joint.
