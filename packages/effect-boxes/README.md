# Effect Boxes

A functional layout system for terminal applications built with Effect.js.
Create TUIs with composable boxes, ANSI styling, and reactive components.

![Effect Boxes Demo](../../media/demo.gif)

## What is Effect Boxes?

Effect Boxes is a TypeScript library inspired by Haskell's
`Text.PrettyPrint.Boxes`, providing a flex-style layout system for terminal
applications within the Effect ecosystem. It started from the original box model
and function naming, then grew into its own implementation with Effect
integration, annotations, ANSI styling, and reactive rendering support. Think of
it as a CSS flexbox system, but built specifically for functional composition of
elements in terminal UIs, ASCII art, and structured text output.

## Key Features

- **Flex-y Layout System**: Horizontal and vertical composition with alignment
  control
- **Text Flow**: Automatic paragraph wrapping and column layout
- **ANSI Color Support**: Rich terminal styling with colors and text attributes
- **Reactive Components**: Create dynamic UIs with efficient partial updates

## Installation

```bash
npm install effect-boxes
# or
bun add effect-boxes
# or
pnpm add effect-boxes
# or
yarn add effect-boxes
```

## Quick Start

```typescript
import { Box, Ansi } from "effect-boxes";
// Alternative import patterns:
// import * as Box from "effect-boxes/Box";
// import * as Ansi from "effect-boxes/Ansi";

// Create a simple box with colored text and positioning
const myBox = Box.hsep(
  [
    Box.text("Hello").pipe(Box.annotate(Ansi.green)), 
    Box.text("\nEffect").pipe(Box.annotate(Ansi.bold)),
    Box.text("Boxes!").pipe(Box.annotate(Ansi.blue)),
   ],
  1,
  Box.left
);

// Render to string (with ANSI colors)
console.log(Box.renderPrettySync(myBox));
/**
 *  Hello        Boxes!
 *        Effect 
 */
```

## Example: Creating a Table

```typescript
import { pipe } from "effect";
import { Box } from "effect-boxes";

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

console.log(Box.renderPlainSync(table));
/**
*      Name     |     Age      |     City
*  ------------------------------------------
*  Alice        | 30           | New York
*  Bob          | 25           | London
*  Charlie      | 35           | Tokyo
*/
```

## Documentation

Full documentation is available at
[effect-boxes.lloydrichards.dev](https://effect-boxes.lloydrichards.dev).

### Getting Started

New to Effect Boxes? Start here:
[Getting Started](https://effect-boxes.lloydrichards.dev/getting-started)

### Guides

- [Using Box](https://effect-boxes.lloydrichards.dev/guides/using-box) - Core layout primitives and composition
- [Using Annotation](https://effect-boxes.lloydrichards.dev/guides/using-annotation) - Adding metadata to boxes
- [Using Ansi](https://effect-boxes.lloydrichards.dev/guides/using-ansi) - Terminal colors and styling
- [Using Layout](https://effect-boxes.lloydrichards.dev/guides/using-layout) - Higher-level Flex, Container, and Grid layouts
- [Using Cmd](https://effect-boxes.lloydrichards.dev/guides/using-cmd) - Terminal control sequences
- [Rendering](https://effect-boxes.lloydrichards.dev/guides/rendering) - Output and rendering strategies
- [Common Patterns](https://effect-boxes.lloydrichards.dev/guides/common-patterns) - Reusable patterns and examples

### API Reference

Full API documentation for each module:
[API Reference](https://effect-boxes.lloydrichards.dev/api/box)

## Contributing

Interested in contributing? See [CONTRIBUTING.md](./CONTRIBUTING.md) for
development setup, commands, and release process.

## License

BSD-3-Clause

This library is inspired by Haskell's `Text.PrettyPrint.Boxes` by Brent Yorgey.
