# Common Patterns

This document covers common patterns, Effect.js integration details, and
reusable components that apply across multiple modules in Effect Boxes.

## Effect.js Integration

Effect Boxes integrates with the Effect.js ecosystem through several key
interfaces and patterns.

### Pipeable Interface

All box operations support both data-first and data-last styles:

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes";

// Data-first style
const box1 = Box.moveRight(Box.text("Hello"), 5);

// Data-last style with pipe
const box2 = pipe(Box.text("Hello"), Box.moveRight(5));

// Method chaining with .pipe()
const box3 = Box.text("Hello").pipe(Box.moveRight(5));
```

### Equal Interface

Boxes implement Effect's `Equal` interface for structural equality:

```typescript
import { Equal } from "effect";
import * as Box from "effect-boxes";

const box1 = Box.text("hello");
const box2 = Box.text("hello");
const box3 = Box.text("world");

console.log(Equal.equals(box1, box2)); // true
console.log(Equal.equals(box1, box3)); // false
```

### Hash Interface

Boxes implement Effect's `Hash` interface for efficient collection operations:

```typescript
// Boxes can be used as Set keys or Map keys
const boxSet = new Set([box1, box2, box3]);
console.log(boxSet.size); // 2 (box1 and box2 are equal)
```

### Dual Functions

Most functions support both data-first and data-last parameter ordering:

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes";

// Data-first: function(data, param)
const box1 = Box.alignHoriz(Box.text("Hello"), Box.center1, 20);

// Data-last: pipe(data, function(param))
const box2 = pipe(Box.text("Hello"), Box.alignHoriz(Box.center1, 20));
```

## Reusable UI Patterns

### Creating a Border

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes";
import { Array } from "effect";

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

const bordered = Border(Box.text("Hello\nWorld"));
console.log(Box.render(bordered));
/*
┌─────┐
│Hello│
│World│
└─────┘
*/
```

### Adding Padding

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes";

const Padding = (width: number) => (self: Box.Box) =>
  pipe(
    self,
    Box.moveUp(width),
    Box.moveDown(width),
    Box.moveLeft(width),
    Box.moveRight(width)
  );

const padded = Padding(2)(Box.text("Hello"));
console.log(Box.renderWith(padded, "."));
/*
.........
.........
..Hello..
.........
.........
*/
```

### Creating a Table

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes";

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
```

### Status Indicators

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes";
import * as Ansi from "effect-boxes/ansi";

const createStatusBox = (status: "success" | "error" | "warning" | "info") => {
  const styles = {
    success: Ansi.combine(Ansi.green, Ansi.bold),
    error: Ansi.combine(Ansi.red, Ansi.bold),
    warning: Ansi.combine(Ansi.yellow, Ansi.bold),
    info: Ansi.combine(Ansi.blue, Ansi.bold),
  };

  const icons = {
    success: "✓",
    error: "✗",
    warning: "⚠",
    info: "ℹ",
  };

  return pipe(
    Box.text(`${icons[status]} ${status.toUpperCase()}`),
    Box.annotate(styles[status])
  );
};

const statusBox = createStatusBox("success");
console.log(Box.render(statusBox, { style: "pretty" }));
// Renders: "✓ SUCCESS" in bold green
```

### Progress Bar

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes";
import * as Ansi from "effect-boxes/ansi";

const progressBar = (progress: number, total: number, width: number) => {
  const ratio = Math.min(Math.max(progress / total, 0), 1);
  const filledLength = Math.round(ratio * width);
  const emptyLength = width - filledLength;

  // Dynamic color based on progress
  const r = Math.round(255 * (1 - ratio));
  const g = Math.round(255 * ratio);
  const progressColor =
    progress === total ? Ansi.green : Ansi.colorRGB(r, g, 0);

  const filledBar = Box.text("█".repeat(filledLength)).pipe(
    Box.annotate(progressColor)
  );
  const emptyBar = Box.text("░".repeat(emptyLength));

  return pipe(filledBar, Box.hAppend(emptyBar));
};

const bar = progressBar(75, 100, 50);
console.log(Box.render(bar, { style: "pretty" }));
// Renders a progress bar that's 75% complete with color gradient
```

## Module Integration Patterns

### Box + ANSI

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes";
import * as Ansi from "effect-boxes/ansi";

// Add ANSI color to a box
const coloredBox = Box.annotate(Box.text("Error!"), Ansi.red);

// Combine multiple styles
const styledBox = pipe(
  Box.text("Important"),
  Box.annotate(Ansi.combine(Ansi.bold, Ansi.underlined, Ansi.red))
);
```

### Box + Cmd

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes";
import * as Cmd from "effect-boxes/cmd";

// Combine boxes and commands for complex layouts
const complexLayout = pipe(
  Cmd.clearScreen,
  Box.combine(
    Box.text("Title").pipe(
      Box.annotate(Ansi.bold),
      Box.alignHoriz(Box.center1, 80)
    )
  ),
  Box.combine(Cmd.cursorTo(0, 5)),
  Box.combine(Box.text("Content goes here"))
);
```

### Box + Reactive + Cmd

```typescript
import { pipe, Option } from "effect";
import * as Box from "effect-boxes";
import * as Reactive from "effect-boxes/reactive";
import * as Cmd from "effect-boxes/cmd";

// Create a layout with reactive elements
const layout = Box.vcat(
  [
    Box.text("Header"),
    Reactive.makeReactive(Box.text("Click me!"), "button"),
    Box.text("Footer"),
  ],
  Box.left
);

// Get positions of reactive elements
const positions = Reactive.getPositions(layout);

// Move cursor to the button
const moveToButton = Reactive.cursorToReactive(positions, "button");

// Render the layout and then position cursor at the button
const program = pipe(
  layout,
  Box.combine(Option.getOrElse(moveToButton, () => Box.nullBox)),
  Box.render({ style: "pretty" })
);
```

## See Also

- [Box Module](./box.md) - Core box creation and composition
- [Annotation Module](./annotation.md) - Text annotation system
- [ANSI Module](./ansi.md) - Terminal rendering with ANSI codes
- [Cmd Module](./cmd.md) - Terminal control commands
- [Reactive Module](./reactive.md) - Position tracking for interactive elements
