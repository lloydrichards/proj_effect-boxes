# Reactive Module

The Reactive module provides position tracking capabilities for boxes, enabling
interactive terminal interfaces where you can precisely locate and update
specific elements.

## Core Concepts

The Reactive module uses the Annotation system to attach unique identifiers to
boxes. When rendered, these identifiers allow you to track the exact position of
each box in the terminal output, making it possible to:

1. Move the cursor to specific UI elements
2. Update individual components without redrawing the entire screen
3. Create interactive interfaces with focused elements

## Basic Usage

### Creating Reactive Boxes

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import * as Reactive from "effect-boxes/Reactive";

// Create a box with a reactive identifier
const button = Reactive.makeReactive(Box.text("[ OK ]"), "ok-button");

// Create a box with a reactive identifier using pipe
const inputField = pipe(
  Box.text("Enter your name: ___________"),
  Reactive.makeReactive("input-field")
);

// Create a layout with multiple reactive elements
const form = Box.vcat(
  [
    Box.text("Login Form").pipe(Reactive.makeReactive("form-title")),
    Box.text("Username:").pipe(
      Box.hAppend(
        Box.text("_________").pipe(Reactive.makeReactive("username-field"))
      )
    ),
    Box.text("Password:").pipe(
      Box.hAppend(
        Box.text("_________").pipe(Reactive.makeReactive("password-field"))
      )
    ),
    Box.hcat(
      [
        Box.text("[ Cancel ]").pipe(Reactive.makeReactive("cancel-button")),
        Box.text("[ Submit ]").pipe(Reactive.makeReactive("submit-button")),
      ],
      Box.center1
    ),
  ],
  Box.left
);
```

### Tracking Positions

```typescript
import * as Box from "effect-boxes/Box";
import * as Reactive from "effect-boxes/Reactive";

// Create a form with reactive elements
const form = Box.vcat(
  [
    Box.text("Login Form").pipe(Reactive.makeReactive("form-title")),
    Box.text("Username: _________").pipe(Reactive.makeReactive("username-field")),
  ],
  Box.left
);

// Render the layout and get positions of all reactive elements
const positions = Reactive.getPositions(form);

// positions is a HashMap<string, { row, col, rows, cols }>
// with entries for "form-title", "username-field", etc.

// Get the position of a specific element
const usernamePosition = positions.get("username-field");
if (usernamePosition) {
  console.log(
    `Username field is at row ${usernamePosition.row}, column ${usernamePosition.col}`
  );
  console.log(
    `It has dimensions: ${usernamePosition.rows} rows × ${usernamePosition.cols} columns`
  );
}
```

### Moving Cursor to Reactive Elements

```typescript
import { Option } from "effect";
import * as Box from "effect-boxes/Box";
import * as Cmd from "effect-boxes/Cmd";
import * as Reactive from "effect-boxes/Reactive";

// Assuming positions from previous example
const form = Box.vcat(
  [
    Box.text("[ OK ]").pipe(Reactive.makeReactive("ok-button")),
    Box.text("[ Cancel ]").pipe(Reactive.makeReactive("cancel-button")),
  ],
  Box.left
);
const positions = Reactive.getPositions(form);

// Get a cursor movement command to a specific reactive element
const moveToCancelButton = Reactive.cursorToReactive(
  positions,
  "cancel-button"
);

// Use with Option handling
const cursorCommand = Option.getOrElse(
  moveToCancelButton,
  () => Cmd.cursorTo(0, 0) // Default if element not found
);

// Render the cursor movement
console.log(Box.renderPrettySync(cursorCommand));
```

## Practical Example: Interactive Form Navigation

```typescript
import { Effect, Option, pipe } from "effect";
import * as Ansi from "effect-boxes/Ansi";
import * as Box from "effect-boxes/Box";
import * as Cmd from "effect-boxes/Cmd";
import * as Reactive from "effect-boxes/Reactive";

// Create a form with multiple fields
const createForm = (focusedField: string) => {
  // Helper to style the currently focused field
  const styleField = (fieldId: string, content: string) =>
    Box.text(content).pipe(
      Box.annotate(
        focusedField === fieldId
          ? Ansi.combine(Ansi.bgBlue, Ansi.white)
          : Ansi.dim
      ),
      Reactive.makeReactive(fieldId)
    );

  return Box.vcat(
    [
      Box.text("User Registration").pipe(
        Box.annotate(Ansi.bold),
        Box.alignHoriz(Box.center1, 40)
      ),
      Box.text(""),
      Box.hcat(
        [
          Box.text("Name: ").pipe(Box.alignHoriz(Box.right, 12)),
          styleField("name-field", "John Doe"),
        ],
        Box.top
      ),
      Box.hcat(
        [
          Box.text("Email: ").pipe(Box.alignHoriz(Box.right, 12)),
          styleField("email-field", "john@example.com"),
        ],
        Box.top
      ),
      Box.hcat(
        [
          Box.text("Password: ").pipe(Box.alignHoriz(Box.right, 12)),
          styleField("password-field", "********"),
        ],
        Box.top
      ),
      Box.text(""),
      Box.hcat(
        [
          styleField("cancel-button", "[ Cancel ]"),
          styleField("submit-button", "[ Submit ]"),
        ],
        Box.center1
      ).pipe(Box.alignHoriz(Box.center1, 40)),
    ],
    Box.left
  );
};

// Simulate form navigation
const formNavigation = Effect.gen(function* () {
  const fields = [
    "name-field",
    "email-field",
    "password-field",
    "cancel-button",
    "submit-button",
  ];

  // Initial render with first field focused
  let currentFieldIndex = 0;
  let form = createForm(fields[currentFieldIndex]);

  // Render initial form
  yield* Effect.sync(() =>
    console.log(
      Box.renderPrettySync(pipe(Cmd.clearScreen, Box.combine(form)))
    )
  );

  // Simulate tabbing through fields
  for (let i = 0; i < fields.length; i++) {
    yield* Effect.sleep("800 millis");

    // Move to next field
    currentFieldIndex = (currentFieldIndex + 1) % fields.length;
    form = createForm(fields[currentFieldIndex]);

    // Get positions of all reactive elements
    const positions = Reactive.getPositions(form);

    // Get cursor command for the focused field
    const moveToCurrent = Reactive.cursorToReactive(
      positions,
      fields[currentFieldIndex]
    );

    // Render the updated form and move cursor to focused field
    yield* Effect.sync(() =>
      console.log(
        Box.renderPrettySync(
          pipe(
            Cmd.cursorTo(0, 0),
            Box.combine(form),
            Box.combine(Option.getOrElse(moveToCurrent, () => Box.nullBox))
          )
        )
      )
    );
  }
});
```

## API Reference

### Core Types

```typescript
// Position tracking map
export type PositionMap = HashMap.HashMap<
  string, // Reactive ID
  {
    readonly row: number; // 0-based row position
    readonly col: number; // 0-based column position
    readonly rows: number; // height of the box
    readonly cols: number; // width of the box
  }
>;
```

### Key Functions

```typescript
// Create a reactive box
makeReactive<A>(self: Box<A>, id: string): Box<Reactive>
makeReactive(id: string): <A>(self: Box<A>) => Box<Reactive>

// Get positions of all reactive elements
getPositions<A>(self: Box<A>): PositionMap

// Get cursor command to move to a reactive element
cursorToReactive(positionMap: PositionMap, key: string): Option.Option<Box<AnsiStyle>>
cursorToReactive(key: string): (positionMap: PositionMap) => Option.Option<Box<AnsiStyle>>
```

## See Also

- [Box Module](./using-box.md) - Core box creation and composition
- [Layout Module](./using-layout.md) - Higher-level Flex, Container, and Grid layouts
- [Cmd Module](./using-cmd.md) - Terminal control commands
- [ANSI Module](./using-ansi.md) - Terminal styling with ANSI codes
- [Common Patterns](./common-patterns.md) - For integration examples and
  reusable patterns
