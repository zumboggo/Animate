# Shared child rig standard

Anna, Sarah, Grace, and Elliott use the `episodeKid` preset. Leah remains on her smaller baby rig, and future adults will use a separate preset.

## Why this structure

- One skeleton drives every child skin. Unity's official 2D Animation samples call this **Skeleton Sharing** and use sprite swapping to reuse animation clips across appearances.
- Bones control motion; slots control artwork and draw order. Spine explicitly separates slots from bones so the same skeleton can swap attachments while preserving layer order.
- Independent limbs need intentional overlap at their attachment points. Adobe Character Animator recommends positioning origins at attachment points and supports upper/lower limb segments around elbow and knee handles.
- Large or cross-body gestures use authored pose sprites. The reusable rig is reserved for restrained motion where it stays clean.

References: [Unity Sprite Swap and Skeleton Sharing](https://docs.unity3d.com/Packages/com.unity.2d.animation@10.0/manual/ex-sprite-swap.html), [Spine slots and draw order](https://esotericsoftware.com/spine-slots), [Adobe mesh attachments and handles](https://helpx.adobe.com/adobe-character-animator/using/attachment-and-handles.html), and [Live2D draw order](https://docs.live2d.com/en/cubism-editor-manual/draworder/).

## Geometry contract

- Canvas: `0.5` width-to-height ratio.
- Main child scale: `1.0`.
- Arms: two pieces. The upper arm sits behind the torso. The forearm, including the relaxed curved hand, sits above the upper arm but remains inside the arm's behind-torso stacking context.
- Legs: two pieces. The thigh extends under the pelvis. The lower leg includes the shoe and overlaps the thigh, avoiding a separate ankle/foot seam.
- Torso and pelvis render above shoulder and hip attachments, hiding pivots.
- Pointing, sitting, laughing, crying, scared poses, and other large silhouettes use full-body pose art rather than exposing joints.

Canonical filenames under each skin's `parts/standard/` folder:

`torso.png`, `pelvis.png`, `left-upper-arm.png`, `left-forearm.png`, `right-upper-arm.png`, `right-forearm.png`, `left-thigh.png`, `left-shin.png`, `right-thigh.png`, and `right-shin.png`.

The layer rectangles and bone pivots live only in [`src/rig/sharedPuppetRig.ts`](../src/rig/sharedPuppetRig.ts). Tuning that file affects the whole child cast.

## Artwork and transparency

- Put new generated parts on a perfectly flat `#00ff00` chroma-key background with no shadow, texture, gradient, or green in the subject.
- Remove the key before committing the skin. Runtime assets must be 32-bit PNGs with transparent padding and fully transparent corners.
- Run `powershell -ExecutionPolicy Bypass -File scripts/build-child-skins.ps1` after replacing source art. It normalizes every body slot onto the same transparent canvas and verifies the corners.
- Reference sheets may retain their chroma background; nothing under a runtime `parts/standard/` folder may retain it.
