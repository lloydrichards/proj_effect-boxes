# Effect Box

A TypeScript port of Haskell's `Text.PrettyPrint.Boxes` library, providing a
functional layout system for terminal applications within the Effect ecosystem.

## Overview

The **Box** module is functional text layout system for Effect, ported over from
Haskell. Think of it as a CSS flexbox system, but built specifically for
functional composition of elements in terminal UIs, ASCII art, and structured
text output.

> [!NOTE] This repository is a work in progress. The Box module _may_ eventually
> be:
>
> - Published as a standalone NPM package
> - Integrated directly into the Effect ecosystem via a pull request
> - Used as inspiration for official Effect terminal UI libraries

## Quick Start

- [Bun](https://bun.sh) runtime

```bash
# Install dependencies
bun install

# Run tests
bun test
bun test --watch

# Types, Lint and format
bun type-check
bun lint
bun format
```

### Exploring the Scratchpad

The `scratchpad/index.ts` file contains a live example showcasing Box
capabilities within an Effect program:

```bash
bun run scratch
```

This demonstrates:

- Real-time progress bar updates using Effect Streams
- Status bars with live timestamps
- Bordered components
- Integration with Effect's Clock and Console

### Understanding the Example

The scratchpad shows how `Box` integrates with Effect:

```typescript
const main = Effect.gen(function* () {
  const counterRef = yield* Ref.make(0); // State management

  const tickStream = Stream.repeatEffect(
    Effect.gen(function* () {
      // Application logic
    })
  ).pipe(
    // when to stop the loop
    Stream.schedule(Schedule.spaced("200 milli"))
  );

  yield* Stream.runForEach(tickStream, ({ counter, timestamp }) =>
    Effect.gen(function* () {
      yield* Console.clear; // Clear terminal for redraw

      // Render progress bar with latest data
      yield* Box.printBox(
        pipe(
          [
            ProgressBar().pipe(Border),
            Box.text().pipe(Box.alignHoriz(Box.right, 5), Border),
          ],
          Box.hcat(Box.center1),
          Padding(1),
          Border
        )
      );

      // Render status bar with latest data
      yield* Box.printBox(
        StatusBar().pipe(Box.alignHoriz(Box.center1, 80), Border)
      );

      yield* Console.log("\nPress Ctrl+C to stop...");
    })
  );

  yield* Console.log("\n ...Task completed successfully!");
});
```

```txt
┌────────────────────────────────────────────────────────────────────────────────┐
│                                                                                │
│ ┌─────────────────────────────────────────────────────────────────────┐┌─────┐ │
│ │██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░││  14%│ │
│ └─────────────────────────────────────────────────────────────────────┘└─────┘ │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────┐
│             Status: Running...  |  Counter: 9  |  Time: 1:43:52 PM             │
└────────────────────────────────────────────────────────────────────────────────┘


Press Ctrl+C to stop...
```

## What is the Box Module?

A **Box** is a rectangular container with explicit dimensions (rows and columns)
that can hold text or other boxes. Like the DOM tree, boxes can be nested within
other boxes to create complex hierarchical layouts through functional
composition. Each box knows its size and can be combined with others using
mathematical operations:

```ts
// Simple boxes
const g = Box.text("Hello\nWorld"); // 2 rows, 5 cols
const s = Box.emptyBox(1, 3); // 1 row, 3 cols
```

```ts
// Hierarchical composition (like DOM nesting)
const nested = Box.vcat(
  // Parent container
  [
    Box.text("Header"), // Child container
    Box.hcat(
      // Child container
      [
        Box.text("Left"), // Nested child
        spacer, // Nested child
        Box.text("Right"), // Nested child
      ],
      Box.center1
    ),
    Box.text("Footer"), // Child container
  ],
  Box.left
);
```

### Effect Superpowers

1. **Pipeable**: Boxes implement Effect's `Pipeable` interface, enabling
   composition with the `.pipe()` method for chaining transformations
2. **Equal**: Built-in structural equality through Effect's `Equal` interface,
   allowing value-based comparisons and safe use in collections
3. **Hash**: Optimized equality checks via Effect's `Hash` interface, providing
   efficient hash-based lookups and deduplication
4. **Immutability**: All operations return new boxes, never mutating existing
   ones—following Effect's functional principles
5. **Composition**: Combine boxes horizontally (`hcat`), vertically (`vcat`), or
   with spacing and alignment using mathematical operations

## Main Components

### Box Creation

```typescript
import * as Box from "./src/Box";

// Create boxes from text
const greeting = Box.text("Hello\nWorld");

// Create empty boxes with specific dimensions
const spacer = Box.emptyBox(2, 10);

// Create single character boxes
const border = Box.char("│");
```

### Layout Operations

```typescript
// Horizontal composition
const row = Box.hcat(
  [Box.text("Left"), Box.text("Center"), Box.text("Right")],
  Box.center1
);

// Vertical composition
const column = Box.vcat(
  [Box.text("Top"), Box.text("Middle"), Box.text("Bottom")],
  Box.left
);

// With spacing
const spaced = Box.hsep([Box.text("A"), Box.text("B")], 3, Box.top);
```

### Alignment and Positioning

```typescript
// Align within specific dimensions
const centered = Box.align(
  Box.text("Center me!"),
  Box.center1, // horizontal alignment
  Box.center1, // vertical alignment
  5, // height
  20 // width
);

// Move boxes around
const positioned = Box.text("Hello").pipe(Box.moveRight(5), Box.moveDown(2));
```

### Text Flow and Paragraphs

```typescript
// Flow text into paragraphs
const paragraph = Box.para(
  "This is a long text that will be automatically flowed into multiple lines.",
  Box.left,
  30 // width
);

// Create newspaper-style columns
const columns = Box.columns(
  "Very long article text here...",
  Box.left,
  20, // column width
  10 // column height
);
```

## Common Usage Examples

### Creating a Simple Table

```typescript
// Create a simple table layout
const createTable = (headers: string[], rows: string[][]) => {
  const headerRow = Box.punctuateH(
    headers.map((h) => Box.text(h).pipe(Box.alignHoriz(Box.center1, 12))),
    Box.top,
    Box.text(" | ")
  );

  const separator = Box.text("-".repeat(headerRow.cols));

  const dataRows = rows.map((row) =>
    Box.punctuateH(
      row.map((cell) => Box.text(cell).pipe(Box.alignHoriz(Box.left, 12))),
      Box.top,
      Box.text(" | ")
    )
  );

  return Box.vcat([headerRow, separator, ...dataRows], Box.left);
};

const table = createTable(
  ["Name", "Age", "City"],
  [
    ["Alice", "30", "New York"],
    ["Bob", "25", "London"],
    ["Charlie", "35", "Tokyo"],
  ]
);

console.log(Box.render(table));
/*
    Name     |     Age      |     City
------------------------------------------
Alice        | 30           | New York
Bob          | 25           | London
Charlie      | 35           | Tokyo

```

### Padding and Margins

```typescript
// Add padding around a box
const Padding = (width: number) => (self: Box.Box) =>
  pipe(
    self,
    Box.moveUp(width),
    Box.moveDown(width),
    Box.moveLeft(width),
    Box.moveRight(width)
  );

const padded = Box.text("Hello\nWorld").pipe(Padding(2));

console.log(Box.renderWith(padded, "."));
/*
.........
.........
..Hello..
..World..
.........
.........
```

### Bordered Content

```typescript
// Add a border around a box
const Border = (self: Box.Box) => {
  const middleBorder = pipe(
    Array.makeBy(self.rows, () => Box.char("│")),
    Box.vcat(Box.left)
  );

  const topBorder = pipe(
    [Box.char("┌"), Box.text("─".repeat(self.cols)), Box.char("┐")],
    Box.hcat(Box.top)
  );

  const bottomBorder = pipe(
    [Box.char("└"), Box.text("─".repeat(self.cols)), Box.char("┘")],
    Box.hcat(Box.top)
  );

  const middleSection = pipe(
    [middleBorder, self, middleBorder],
    Box.hcat(Box.top)
  );

  return pipe([topBorder, middleSection, bottomBorder], Box.vcat(Box.left));
};

const bordered = Box.text("Hello\nWorld").pipe(Border);

console.log(Box.render(bordered));
/*
┌─────┐
│Hello│
│World│
└─────┘
```
