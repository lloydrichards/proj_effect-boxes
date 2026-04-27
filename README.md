# Effect Boxes

A functional layout system for terminal applications built with Effect.js.
Create TUIs with composable boxes, ANSI styling, and reactive components.

## What is Effect Boxes?

Effect Boxes is a TypeScript library inspired by Haskell's
`Text.PrettyPrint.Boxes`, providing a flex-style layout system for terminal
applications within the Effect ecosystem. It started from the original box
model and function naming, then grew into its own implementation with Effect
integration, annotations, ANSI styling, and reactive rendering support. Think
of it as a CSS flexbox system, but built specifically for functional
composition of elements in terminal UIs, ASCII art, and structured text
output.

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
import { pipe } from "effect";
import { Box, Ansi } from "effect-boxes";

// Create a simple bordered box with colored text
const myBox = pipe(
  Box.text("Hello, Effect Boxes!"),
  Box.annotate(Ansi.blue),
  Box.moveRight(2),
  Box.moveDown(1)
);

// Render to string
console.log(Box.render(myBox));

// Alternative import patterns:
// import * as Box from "effect-boxes/Box";
// import * as Ansi from "effect-boxes/Ansi";
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

console.log(Box.render(table));
/*
    Name     |     Age      |     City
------------------------------------------
Alice        | 30           | New York
Bob          | 25           | London
Charlie      | 35           | Tokyo
*/
```

## Module Overview

| Module         |                                   Documentation | Description                                                                              |
| -------------- | ----------------------------------------------: | ---------------------------------------------------------------------------------------- |
| **Box**        |               [Box Module](./docs/using-box.md) | Core box creation and composition functions (`hcat`, `vcat`, `text`, `align`, `render`). |
| **Annotation** | [Annotation Module](./docs/using-annotation.md) | Generic system for attaching metadata/annotations to boxes (styling, semantics).         |
| **ANSI**       |             [ANSI Module](./docs/using-ansi.md) | ANSI styling and terminal rendering utilities (colors, attributes).                      |
| **Cmd**        |               [Cmd Module](./docs/using-cmd.md) | Terminal control commands (cursor movement, screen clearing, etc.).                      |
| **Reactive**   |     [Reactive Module](./docs/using-reactive.md) | Position tracking and primitives for interactive terminal interfaces.                    |
| **Width**      |                                                 | Text width calculation utilities (unicode and ANSI-aware measurements).                  |

> Note: For reusable patterns, testing guidance, and Effect.js integration
> examples, see Common Patterns — [Common Patterns](./docs/common-patterns.md).

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Type check
bun type-check

# Lint and format
bun lint
bun format

# Run examples
bun run scratch
```

### Releasing a New Version

This project uses [changesets](https://github.com/changesets/changesets) to
manage versioning, changelogs, and npm publishing.

1. **Add a changeset** when making a noteworthy change:

   ```bash
   bunx changeset
   ```

   Follow the prompts to select a semver bump type (patch/minor/major) and
   describe the change. This creates a markdown file in `.changeset/`.

2. **Commit the changeset** along with your code changes and push to `main`.

3. **Automated release PR**: The CI workflow detects pending changesets and
   opens a "Version Packages" PR that bumps `package.json`, updates
   `CHANGELOG.md`, and removes consumed changeset files.

4. **Merge the release PR**: Once merged, the workflow automatically publishes
   the new version to npm.

5. **Verify the release**: Check the
   [Actions tab](https://github.com/lloydrichards/proj_effect-boxes/actions) to
   confirm the publish succeeded, then verify on
   [npm](https://www.npmjs.com/package/effect-boxes).

## License

BSD-3-Clause.

This library is inspired by Haskell's `Text.PrettyPrint.Boxes` by Brent Yorgey.
