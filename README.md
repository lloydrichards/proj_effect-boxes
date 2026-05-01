# Effect Boxes

A functional layout system for terminal applications built with Effect.js.
Create TUIs with composable boxes, ANSI styling, and reactive components.

![Effect Boxes Demo](media/demo.gif)

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

| Module         | Description                                                               |
| -------------- | ------------------------------------------------------------------------- |
| **Box**        | Core box creation and composition (`hcat`, `vcat`, `text`, `align`, etc.) |
| **Annotation** | Attach metadata/annotations to boxes for styling and semantics            |
| **ANSI**       | Terminal styling with colors and text attributes                          |
| **Cmd**        | Terminal control commands (cursor movement, screen clearing)              |
| **Reactive**   | Position tracking for interactive terminal interfaces                     |
| **Width**      | Unicode and ANSI-aware text width calculations                            |

### Guides

- [Box Module](./docs/using-box.md) - Core layout primitives and composition
- [Annotation Module](./docs/using-annotation.md) - Adding metadata to boxes
- [ANSI Module](./docs/using-ansi.md) - Terminal colors and styling
- [Cmd Module](./docs/using-cmd.md) - Terminal control sequences
- [Reactive Module](./docs/using-reactive.md) - Building interactive UIs
- [Common Patterns](./docs/common-patterns.md) - Reusable patterns and examples

## Contributing

Interested in contributing? See [CONTRIBUTING.md](./CONTRIBUTING.md) for
development setup, commands, and release process.

## License

BSD-3-Clause

This library is inspired by Haskell's `Text.PrettyPrint.Boxes` by Brent Yorgey.
