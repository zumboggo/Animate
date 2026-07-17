# Writing Stories for Animate ✍️

You write stories as plain text files. The characters read your script and act
it out on screen — walking, sitting, laughing, trembling — like a little
cartoon. No coding needed.

## Quick start

1. Create a new file in the `stories/` folder ending in `.story`, for example
   `stories/my-story.story`.
2. Write your script (see below).
3. Save the file. If the app is running (`npm run dev`), the page reloads and
   your story appears in the 📖 story picker.

Here is a complete tiny story you can copy:

```
title: The Surprise
scene: park

GRACE walks in from left
GRACE (happy): What a lovely morning!

ELLIOTT runs in from right
ELLIOTT: Grace! Guess what!

GRACE (surprised): What? Tell me!
ELLIOTT dances
ELLIOTT (laughing): It's my birthday!

GRACE jumps
GRACE (happy): Happy birthday, Elliott!
```

## The rules of the script

**One thing per line.** Each line is either a title, a scene, dialogue, an
action, an expression, a wait, or a comment.

### Title

```
title: The Spider
```

Shown on the opening card. Put it at the top.

### Scenes (backgrounds)

```
scene: park
```

Available scenes: `park`, `camp`, `bedroom`, `street`, `peppa-land`. You can change scene again in
the middle of a story.

### Dialogue — making characters speak

```
GRACE: What a beautiful day!
ELLIOTT (scared): There's a spider on the bench!!
```

The name comes first, then a colon, then the words. Adding `(emotion)` before
the colon changes the character's face as they speak.

Any language works, including Chinese:

```
GRACE: 你好！
GRACE (happy): 我很高兴。
```

### Actions — making characters DO things

```
GRACE walks in from left
ELLIOTT runs in from right
GRACE walks to center
ELLIOTT sits
GRACE jumps
ELLIOTT acts like a tree
```

The pattern is: **NAME, then the action, then (optionally) a direction.**

Directions: `from left`, `from right`, `to left`, `to center`, `to right`,
`to far left`, `to far right`.

### Expressions — changing a face without speaking

```
GRACE (angry)
ELLIOTT (confused)
```

You can also combine an expression with an action:

```
GRACE (angry) shakes head
ELLIOTT (scared) trembles
```

### Waiting

```
wait 2s
wait 500ms
```

Pauses the story — good for comedic timing.

### Comments

```
# Lines starting with # are notes to yourself. The player ignores them.
```

## All the actions

| Write this | What happens |
|---|---|
| `walks in from left` / `right` | Walks onto the stage |
| `runs in from left` / `right` | Runs onto the stage |
| `walks out` / `runs out` | Leaves the stage |
| `walks to center` (or any position) | Walks to that spot |
| `sits` | Sits down (stays sitting until they stand) |
| `stands` | Stands back up |
| `nods` | Nods yes |
| `shakes head` | Shakes no |
| `waves` | Waves hello/goodbye |
| `jumps` | Jumps in the air |
| `trembles` (or `shakes`, `shivers`) | Shakes with fear |
| `acts scared` | Trembles with a scared face |
| `laughs` | Bounces with laughter |
| `cries` | Covers face, tears appear |
| `points` | Points ahead |
| `dances` | Busts a move |
| `falls` (or `trips`, `falls over`) | Comedy fall! |
| `turns around` | Turns to face the other way |

## All the emotions

`neutral` · `happy` · `sad` · `angry` · `scared` · `surprised` · `laughing` · `confused`

(A few synonyms work too: `mad` → angry, `afraid` → scared, `shocked` → surprised.)

## Special effects

```
screen shakes
camera zooms on ELLIOTT
camera resets
fade to black
fade in
```

## Characters

Characters are defined in `stories/cast.json`. The starting cast includes
**ANNA**, **SARAH**, **GRACE**, **ELLIOTT**, and **LEAH**. In the browser studio, choose
a character portrait before using the dialogue, entrance, or action shortcut.
To add someone new, copy a cast entry and adjust its appearance.

## Playing your story

- **Click the stage or press Space** to advance past dialogue.
- **▶ Autoplay** makes the story perform itself like a movie.
- **⟳ Restart** plays it again from the top.

## When something goes wrong

If you make a typo, the player shows a friendly note instead of the story:

```
Line 7: I don't know the action "trmbles". Did you mean "trembles"?
Line 4: Unknown character "GRCAE". Did you mean "GRACE"?
Line 9: Unknown emotion "scarred". Did you mean "scared"?
```

Fix the line it mentions, save, and the story plays.

Common mistakes:

- **Forgetting the colon in dialogue.** `GRACE Hello!` → the player thinks
  "Hello!" is an action. Write `GRACE: Hello!`.
- **A name with no action.** `GRACE` alone does nothing — give Grace something to
  do or say.
- **`walks` with no direction.** Write `walks to center` or
  `walks in from left`.
- **Choices and labels** (`choice:`, `[label]`) aren't available yet — they're
  coming in a future version. Stories currently play top to bottom.
