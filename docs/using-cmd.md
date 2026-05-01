# Cmd Module

The Cmd module provides terminal control commands for cursor positioning, screen
clearing, and other terminal operations. These commands can be composed with
boxes to create dynamic, interactive terminal interfaces.

## Core Concepts

The `Cmd` module creates special annotation boxes that emit ANSI escape
sequences when rendered. These commands allow precise control over terminal
behavior without affecting the layout model of boxes.

Each command is a zero-size box (nullBox) with an annotation containing the
specific ANSI escape sequence. When rendered with `{ style: "pretty" }`, these
sequences control the terminal's behavior.

## Basic Usage

### Cursor Movement

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import * as Cmd from "effect-boxes/Cmd";

// Move cursor up 3 lines
const moveUp = Cmd.cursorUp(3);

// Move cursor to specific position (column, row)
const moveTo = Cmd.cursorTo(10, 5);

// Move cursor relative to current position
const moveRelative = Cmd.cursorMove(5, -2); // 5 right, 2 up

// Print with cursor commands
console.log(Box.renderPrettySync(moveUp));
```

### Screen Clearing

```typescript
import * as Cmd from "effect-boxes/Cmd";

// Clear the entire screen and move cursor to home position
const clear = Cmd.clearScreen;

// Clear from cursor to end of screen
const clearDown = Cmd.eraseDown;

// Clear the current line
const clearLine = Cmd.eraseLine;

// Clear multiple lines (delete 5 lines from scroll region)
const clearLines = Cmd.eraseLines(5);

// Clear content of previous 5 lines in place (no scrolling)
const clearInPlace = Cmd.clearLines(5);
```

### Cursor Visibility

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import * as Cmd from "effect-boxes/Cmd";

// Hide the cursor (useful for animations)
const hideCursor = Cmd.cursorHide;

// Show the cursor (restore visibility)
const showCursor = Cmd.cursorShow;

// Typical pattern: hide cursor during animation, show when done
const animationSequence = pipe(
  Cmd.cursorHide,
  Box.combine(animationBox),
  Box.combine(Cmd.cursorShow)
);
```

## Combining Commands with Boxes

The real power of the Cmd module comes from combining terminal commands with
regular boxes:

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import * as Cmd from "effect-boxes/Cmd";

// Create a box with text
const textBox = Box.text("Hello, world!");

// Combine with cursor commands
const positionedText = pipe(
  Cmd.cursorTo(10, 5), // Position cursor
  Box.combine(textBox), // Add the text
  Box.combine(Cmd.cursorTo(0, 10)) // Move cursor away after rendering
);

// Render with ANSI commands enabled
console.log(Box.renderPrettySync(positionedText));
```

## Practical Example: Rewriting Previous Output

`clearLines` is useful for overwriting previously printed lines without
affecting the rest of the terminal (e.g. spinners, progress bars):

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import * as Cmd from "effect-boxes/Cmd";

// Print 3 lines, then clear and replace them
const initial = Box.vcat(
  [
    Box.text("Downloading..."),
    Box.text("Progress: 50%"),
    Box.text("ETA: 10s"),
  ],
  Box.left
);

// Later, clear those 3 lines and write new content
const updated = Box.vcat(
  [
    Cmd.clearLines(3),
    Box.text("Downloading..."),
    Box.text("Progress: 100%"),
    Box.text("Done!"),
  ],
  Box.left
);
```

## Practical Example: Partial Screen Updates

```typescript
import { pipe, Effect } from "effect";
import * as Box from "effect-boxes/Box";
import * as Cmd from "effect-boxes/Cmd";
import * as Ansi from "effect-boxes/Ansi";

// Initial setup
const setupScreen = pipe(Cmd.clearScreen, Box.combine(Cmd.cursorHide));

// Update just a portion of the screen
const updateCounter = (count: number) =>
  pipe(
    Cmd.cursorTo(10, 5),
    Box.combine(Box.text(`Count: ${count}`).pipe(Box.annotate(Ansi.green)))
  );

// Cleanup when done
const cleanup = pipe(Cmd.cursorTo(0, 20), Box.combine(Cmd.cursorShow));

// Program that updates a counter in place
const program = Effect.gen(function* () {
  // Setup screen once
  yield* Effect.sync(() =>
    console.log(Box.renderPrettySync(setupScreen))
  );

  // Update counter 10 times
  for (let i = 0; i <= 10; i++) {
    yield* Effect.sync(() =>
      console.log(Box.renderPrettySync(updateCounter(i)))
    );
    yield* Effect.sleep("200 millis");
  }

  // Cleanup when done
  yield* Effect.sync(() =>
    console.log(Box.renderPrettySync(cleanup))
  );
});

Effect.runPromise(program);
```

## See Also

- [Box Module](./using-box.md) - Core box creation and composition
- [ANSI Module](./using-ansi.md) - Terminal styling with ANSI codes
- [Reactive Module](./using-reactive.md) - Position tracking for interactive
  elements
- [Common Patterns](./common-patterns.md) - For integration examples and
  reusable patterns
