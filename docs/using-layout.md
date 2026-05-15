# Layout Module

The Layout module provides higher-level layout combinators built on top of Box.
It offers container-aware composition primitives inspired by CSS Flexbox and CSS
Grid, making it straightforward to distribute space among children
proportionally, build dimension-aware containers, and arrange items in grids.

All helpers are pure functions that return standard Box values, composable with
existing Box primitives (`border`, `annotate`, `pad`, etc).

## Core Concepts

The Layout module is organized into three namespaces:

- **Flex** — flexbox-style row and column layouts that distribute space among
  children proportionally
- **Container** — a dimension-aware wrapper that passes available dimensions to
  a builder function
- **Grid** — fixed-column and auto-column grid layouts for arranging items in
  rows and columns

## Flex Layout

### Child Types

Flex layouts are built from three kinds of children:

```typescript
import * as Box from "effect-boxes/Box";
import { Flex } from "effect-boxes/Layout";

// Fixed: occupies its intrinsic width/height
const label = Flex.fixed(Box.text("Name:"));

// Grow: stretches to fill remaining space (optional factor, default 1)
const value = Flex.grow(Box.text("value"), 2);

// Fill: receives allocated size via builder function
const separator = Flex.fill((width) => Box.text("=".repeat(width)));

// Spacer: pushes adjacent children apart (shorthand for fill with empty box)
const space = Flex.spacer();
```

### Horizontal Layout (Row)

Arrange children horizontally within a fixed container width:

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import { Flex } from "effect-boxes/Layout";

// Data-first
const row = Flex.row(
  [Flex.fixed(Box.text("Name:")), Flex.spacer(), Flex.fixed(Box.text("[ok]"))],
  80
);

// Data-last (pipe)
const row2 = pipe(
  [
    Flex.fixed(Box.text("Name:")),
    Flex.grow(Box.text("value"), 2),
    Flex.fixed(Box.text("[ok]")),
  ],
  Flex.row(80, { gap: 1 })
);
```

### Vertical Layout (Column)

Arrange children vertically within a fixed container height:

```typescript
import * as Box from "effect-boxes/Box";
import { Flex } from "effect-boxes/Layout";

const col = Flex.col(
  [
    Flex.fixed(Box.text("header")),
    Flex.grow(Box.text("body")),
    Flex.fixed(Box.text("footer")),
  ],
  24
);
```

### Flex Options

Both `Flex.row` and `Flex.col` accept an optional options object:

- **`align`** — vertical alignment for row children or horizontal alignment for
  column children (e.g. `Box.top`, `Box.center1`, `Box.bottom`)
- **`gap`** — number of columns (row) or rows (col) of space between children

```typescript
import * as Box from "effect-boxes/Box";
import { Flex } from "effect-boxes/Layout";

const row = Flex.row(
  [Flex.fixed(Box.text("A")), Flex.fixed(Box.text("B"))],
  40,
  { align: Box.center1, gap: 2 }
);
```

### Space Distribution

Fixed children keep their intrinsic size. Grow and Fill children share remaining
space proportionally based on their factor. Remainder columns are distributed
one each to the first N grow children to avoid rounding gaps.

If fixed children exceed the container size, grow children receive 0 space and
the result may be wider/taller than the container.

## Container

The Container provides available dimensions to a builder function, automatically
computing inner dimensions after padding.

```typescript
import * as Box from "effect-boxes/Box";
import { Container } from "effect-boxes/Layout";

const box = Container.make({ width: 40, padding: 1 }, (ctx) =>
  Box.text("inner width: " + ctx.innerWidth)
);
// ctx contains: width, height, innerWidth, innerHeight
```

### Container Options

- **`width`** (required) — outer width of the container
- **`height`** — outer height of the container
- **`padding`** — uniform padding (number) or `[vertical, horizontal]` tuple

The container enforces its width on the output and applies padding
automatically.

## Grid Layout

### Fixed-Column Grid

Arrange items in a grid with a known number of columns and uniform column width:

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import { Grid } from "effect-boxes/Layout";

// Data-first
const grid = Grid.make(["A", "B", "C", "D"].map(Box.text), {
  cols: 2,
  colWidth: 10,
  gap: [1, 0],
});

// Data-last (pipe)
const grid2 = pipe(
  ["A", "B", "C", "D"].map(Box.text),
  Grid.make({ cols: 2, colWidth: 10 })
);
```

### Auto-Column Grid

Let the grid calculate the number of columns from a container width:

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import { Grid } from "effect-boxes/Layout";

// Data-first
const grid = Grid.auto(
  ["A", "B", "C", "D", "E", "F"].map(Box.text),
  80,
  { minColWidth: 20 }
);

// Data-last (pipe)
const grid2 = pipe(
  ["A", "B", "C", "D", "E", "F"].map(Box.text),
  Grid.auto(80, { minColWidth: 20 })
);
```

### Grid Options

**`Grid.make` options:**

- **`cols`** — number of columns
- **`colWidth`** — uniform width of each column
- **`gap`** — `[horizontal, vertical]` spacing between cells
- **`align`** — alignment of items within their cells
- **`stretch`** — whether to stretch items to fill their cell width

**`Grid.auto` options:**

- **`minColWidth`** — minimum column width used to calculate column count
- **`maxColWidth`** — optional maximum column width
- **`gap`** — spacing between cells
- **`align`** — alignment of items within their cells
- **`stretch`** — whether to stretch items to fill their cell width

## Composing with Box Primitives

Layout results are standard Box values. Compose them freely with borders,
padding, annotations, and other Box operations:

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import * as Ansi from "effect-boxes/Ansi";
import { Flex, Container } from "effect-boxes/Layout";

const panel = Container.make({ width: 60, padding: 1 }, (ctx) =>
  pipe(
    Flex.row(
      [
        Flex.fixed(Box.text("Status:")),
        Flex.spacer(),
        Flex.fixed(pipe(Box.text(" OK "), Box.annotate(Ansi.green))),
      ],
      ctx.innerWidth
    ),
    Box.border("rounded")
  )
);
```

## See Also

- [Box Module](./using-box.md) - Core box creation and composition
- [Annotation Module](./using-annotation.md) - For adding metadata to boxes
- [ANSI Module](./using-ansi.md) - For terminal styling with colors and effects
- [Common Patterns](./common-patterns.md) - For Effect.js integration and
  reusable patterns
