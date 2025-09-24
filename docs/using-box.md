# Box Module

The Box module is the core of the Effect Boxes library, providing the fundamental
data structures and operations for creating and composing rectangular text
layouts.

## Core Concepts

A **Box** is a rectangular container with explicit dimensions (rows and columns)
that can hold text or other boxes. Each box knows its size and can be combined
with others to create complex layouts through functional composition.

## Box Creation

### Basic Box Creation

```typescript
import * as Box from "effect-boxes";

// Create a box from text (automatically handles multi-line strings)
const textBox = Box.text("Hello\nWorld");
// Result: 2 rows, 5 columns

// Create an empty box with specific dimensions
const emptyBox = Box.emptyBox(3, 10);
// Result: 3 rows, 10 columns

// Create a single-character box
const charBox = Box.char("*");
// Result: 1 row, 1 column

// Create a single-line box (strips newlines)
const lineBox = Box.line("Hello\nWorld");
// Result: 1 row, 11 columns
```

### Text Flow and Paragraphs

```typescript
// Flow text into a paragraph with automatic wrapping
const paragraph = Box.para(
  "This is a long text that will be automatically flowed into multiple lines based on the specified width.",
  Box.left, // Alignment
  30 // Width
);

// Create newspaper-style columns
const columns = Box.columns(
  "Very long article text here that will be split into multiple columns...",
  Box.left, // Alignment
  20, // Column width
  10 // Column height
);
```

## Box Composition

### Horizontal Composition

```typescript
import { pipe } from "effect";

// Combine boxes horizontally with alignment
const row = Box.hcat(
  [Box.text("Left"), Box.text("Center"), Box.text("Right")],
  Box.center1 // Vertical alignment within the row
);

// Horizontal composition with a separator
const rowWithSeparator = Box.punctuateH(
  [Box.text("Name"), Box.text("Age"), Box.text("City")],
  Box.top, // Vertical alignment
  Box.text(" | ") // Separator
);

// Horizontal composition with spacing
const spacedRow = Box.hsep(
  [Box.text("A"), Box.text("B"), Box.text("C")],
  3, // Number of spaces between boxes
  Box.top // Vertical alignment
);
```

### Vertical Composition

```typescript
// Combine boxes vertically with alignment
const column = Box.vcat(
  [Box.text("Top"), Box.text("Middle"), Box.text("Bottom")],
  Box.left // Horizontal alignment within the column
);

// Vertical composition with a separator
const columnWithSeparator = Box.punctuateV(
  [Box.text("Header"), Box.text("Content"), Box.text("Footer")],
  Box.left, // Horizontal alignment
  Box.text("~~~") // Separator
);

// Vertical composition with spacing
const spacedColumn = Box.vsep(
  [Box.text("First"), Box.text("Second"), Box.text("Third")],
  2, // Number of empty rows between boxes
  Box.left // Horizontal alignment
);
```

### Combining Individual Boxes

```typescript
import { pipe } from "effect";

// Append boxes horizontally
const combined1 = Box.hAppend(Box.text("Hello"), Box.text("World"));

// Append boxes horizontally with pipe
const combined2 = pipe(Box.text("Hello"), Box.hAppend(Box.text("World")));

// Append boxes horizontally with a space
const combinedWithSpace = Box.hcatWithSpace(
  Box.text("Hello"),
  Box.text("World")
);

// Append boxes vertically
const stacked = Box.vAppend(Box.text("Top"), Box.text("Bottom"));

// Append boxes vertically with a space
const stackedWithSpace = Box.vcatWithSpace(Box.text("Top"), Box.text("Bottom"));
```

## Alignment and Positioning

### Alignment

```typescript
// Align a box horizontally within a width
const rightAligned = Box.alignHoriz(Box.text("Hello"), Box.right, 20);
// Result: "               Hello"

// Align a box vertically within a height
const bottomAligned = Box.alignVert(Box.text("Hello"), Box.bottom, 5);
// Result: 4 empty rows, then "Hello"

// Align a box both horizontally and vertically
const centered = Box.align(
  Box.text("Center me!"),
  Box.center1, // Horizontal alignment
  Box.center1, // Vertical alignment
  5, // Height
  20 // Width
);
```

### Moving Boxes

```typescript
import { pipe } from "effect";

// Move a box right by adding space to the left
const movedRight = Box.moveRight(Box.text("Hello"), 5);
// Result: "     Hello"

// Move a box down by adding empty rows above
const movedDown = Box.moveDown(Box.text("Hello"), 3);
// Result: 3 empty rows, then "Hello"

// Move a box left by adding space to the right
const movedLeft = Box.moveLeft(Box.text("Hello"), 5);
// Result: "Hello     "

// Move a box up by adding empty rows below
const movedUp = Box.moveUp(Box.text("Hello"), 2);
// Result: "Hello", then 2 empty rows

// Combine movements with pipe
const positioned = pipe(Box.text("Hello"), Box.moveRight(5), Box.moveDown(2));
// Result: 2 empty rows, then "     Hello"
```

## Rendering

```typescript
// Render a box to a string
const rendered = Box.render(myBox);

// Render with custom options
const renderedWithOptions = Box.render(myBox, {
  style: "pretty", // "pretty" (with ANSI) or "plain"
  preserveWhitespace: true, // Keep trailing spaces
  partial: false, // Add final newline
});

// Render with custom fill character
const renderedWithDots = Box.renderWith(myBox, ".");
// Replaces spaces with dots

// Print a box to the console using Effect
import { Effect } from "effect";
const program = Box.printBox(myBox);
Effect.runPromise(program);
```

## Working with Box Dimensions

```typescript
// Get box dimensions
const myBox = Box.text("Hello\nWorld");
console.log(myBox.rows); // 2
console.log(myBox.cols); // 5

// Create a box with specific dimensions
const customBox = Box.emptyBox(5, 10);
console.log(customBox.rows); // 5
console.log(customBox.cols); // 10
```

## Combining with Annotations

```typescript
import { pipe } from "effect";
import * as Ansi from "effect-boxes/ansi";

// Add ANSI color to a box
const coloredBox = Box.annotate(Box.text("Error!"), Ansi.red);

// Alternative data-last style with pipe
const coloredBox2 = pipe(Box.text("Success!"), Box.annotate(Ansi.green));
```

## See Also

- [Annotation Module](./annotation.md) - For adding metadata to boxes
- [ANSI Module](./ansi.md) - For terminal styling with colors and effects
- [Common Patterns](./common-patterns.md) - For Effect.js integration and
  reusable patterns
