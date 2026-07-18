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
remains `0.85`. Dialogue uses the layered rig, independent face shapes, and
mouth animation. Sit, point, laugh, scared recoil, and dance use dedicated
full-body poses. Walk and run combine stage translation, a restrained body bob,
and small nested limb motion; nod, shake, wave, tremble, bounce, and recoil stay
on the rig.

Anna's extracted body and face parts match her red Canada top, heart-patterned
leggings, pink shoes, brown bob, and pink sunglasses. They now form the
production joint-level assembly. Complete pose sprites remain available where
they guarantee cleaner shoulders and hips during difficult actions.

## Pivots and debug tuning

`character.json` contains the live normalized pivots for shoulders, elbows,
wrists, hips, knees, and ankles plus layer image bounds and ordering. Use **Rig
debug** below the stage to inspect every pivot, part outline, and layer label.
Keep arms behind the shirt, place shoulder pivots inside the torso, and preserve
generous overlap at every joint.
