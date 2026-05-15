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
import * as Box from "effect-boxes/Box";

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
import * as Box from "effect-boxes/Box";

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
import * as Box from "effect-boxes/Box";

// Data-first: function(data, param)
const box1 = Box.alignHoriz(Box.text("Hello"), Box.center1, 20);

// Data-last: pipe(data, function(param))
const box2 = pipe(Box.text("Hello"), Box.alignHoriz(Box.center1, 20));
```

## Reusable UI Patterns

### Creating a Border

```typescript
import { pipe, Array } from "effect";
import * as Box from "effect-boxes/Box";

const Border = (self: Box.Box<unknown>) => {
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
console.log(Box.renderPlainSync(bordered));
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
import * as Box from "effect-boxes/Box";

const Padding = (width: number) => (self: Box.Box<unknown>) =>
  pipe(
    self,
    Box.moveUp(width),
    Box.moveDown(width),
    Box.moveLeft(width),
    Box.moveRight(width)
  );

const padded = Padding(2)(Box.text("Hello"));
// Visualize with dots to show padding (rendered output has spaces)
// .........
// .........
// ..Hello..
// .........
// .........
```

### Creating a Table

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";

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
import * as Box from "effect-boxes/Box";
import * as Ansi from "effect-boxes/Ansi";

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
console.log(Box.renderPrettySync(statusBox));
// Renders: "✓ SUCCESS" in bold green
```

### Progress Bar

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import * as Ansi from "effect-boxes/Ansi";

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
console.log(Box.renderPrettySync(bar));
// Renders a progress bar that's 75% complete with color gradient
```

## Module Integration Patterns

### Box + ANSI

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import * as Ansi from "effect-boxes/Ansi";

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
import * as Ansi from "effect-boxes/Ansi";
import * as Box from "effect-boxes/Box";
import * as Cmd from "effect-boxes/Cmd";

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
import * as Box from "effect-boxes/Box";
import * as Reactive from "effect-boxes/Reactive";
import * as Cmd from "effect-boxes/Cmd";

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
const combined = pipe(
  layout,
  Box.combine(Option.getOrElse(moveToButton, () => Box.nullBox))
);
console.log(Box.renderPrettySync(combined));
```

### Box + Layout

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import * as Ansi from "effect-boxes/Ansi";
import { Flex, Container, Grid } from "effect-boxes/Layout";

// Use Flex to build a status bar with items pushed apart
const statusBar = Flex.row(
  [
    Flex.fixed(Box.text("app v1.0").pipe(Box.annotate(Ansi.bold))),
    Flex.spacer(),
    Flex.fixed(Box.text("connected").pipe(Box.annotate(Ansi.green))),
  ],
  80
);

// Use Container for dimension-aware layouts with padding and borders
const panel = Container.make({ width: 60, padding: 1 }, (ctx) =>
  pipe(
    Flex.row(
      [Flex.fixed(Box.text("Name:")), Flex.grow(Box.text("Alice"))],
      ctx.innerWidth
    ),
    Box.border("rounded")
  )
);

// Use Grid to arrange items in columns
const grid = Grid.auto(
  ["Dashboard", "Settings", "Profile", "Logout"].map((label) =>
    pipe(Box.text(label), Box.pad(0, 2), Box.border("rounded"))
  ),
  80,
  { minColWidth: 20 }
);
```

## See Also

- [Box Module](./using-box.md) - Core box creation and composition
- [Layout Module](./using-layout.md) - Higher-level Flex, Container, and Grid layouts
- [Annotation Module](./using-annotation.md) - Text annotation system
- [ANSI Module](./using-ansi.md) - Terminal rendering with ANSI codes
- [Cmd Module](./using-cmd.md) - Terminal control commands
- [Reactive Module](./using-reactive.md) - Position tracking for interactive elements
