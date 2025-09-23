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
import * as Box from "effect-boxes";
import * as Cmd from "effect-boxes/cmd";

// Move cursor up 3 lines
const moveUp = Cmd.cursorUp(3);

// Move cursor to specific position (column, row)
const moveTo = Cmd.cursorTo(10, 5);

// Move cursor relative to current position
const moveRelative = Cmd.cursorMove(5, -2); // 5 right, 2 up

// Print with cursor commands
console.log(Box.render(moveUp, { style: "pretty" }));
```

### Screen Clearing

```typescript
// Clear the entire screen and move cursor to home position
const clear = Cmd.clearScreen;

// Clear from cursor to end of screen
const clearDown = Cmd.eraseDown;

// Clear the current line
const clearLine = Cmd.eraseLine;

// Clear multiple lines (erase 5 lines from cursor position)
const clearLines = Cmd.eraseLines(5);
```

### Cursor Visibility

```typescript
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
// Create a box with text
const textBox = Box.text("Hello, world!");

// Combine with cursor commands
const positionedText = pipe(
  Cmd.cursorTo(10, 5), // Position cursor
  Box.combine(textBox), // Add the text
  Box.combine(Cmd.cursorTo(0, 10)) // Move cursor away after rendering
);

// Render with ANSI commands enabled
console.log(Box.render(positionedText, { style: "pretty" }));
```

## Practical Example: Partial Screen Updates

```typescript
import { Effect } from "effect";
import * as Ansi from "effect-boxes/ansi";

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
    console.log(Box.render(setupScreen, { style: "pretty" }))
  );

  // Update counter 10 times
  for (let i = 0; i <= 10; i++) {
    yield* Effect.sync(() =>
      console.log(Box.render(updateCounter(i), { style: "pretty" }))
    );
    yield* Effect.sleep("200 millis");
  }

  // Cleanup when done
  yield* Effect.sync(() =>
    console.log(Box.render(cleanup, { style: "pretty" }))
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
