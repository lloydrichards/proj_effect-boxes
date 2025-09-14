/**
 * @fileoverview Example demonstrating the new composable Cmd API pattern.
 *
 * This example shows how Cmd constants can be seamlessly composed with Box
 * layout functions using the pipe operator for powerful terminal UI layouts.
 */

import { Array as Arr, Effect, Option } from "effect";
import * as Box from "../src/Box";
import * as Cmd from "../src/Cmd";

// Mock error state for demonstration
type State = {
  error: Option.Option<string>;
  status: string;
};

const NEWLINE_REGEX = /\r?\n/;

/**
 * Example function that demonstrates the desired API pattern.
 * This recreates the user's original example with working code.
 *
 * This demonstrates the core composition pattern: Cmd constants can be
 * seamlessly composed with Box layout functions using hcat, vcat, and hAppend.
 */
function renderError(
  nextState: State,
  pointer: Box.Box<never>
): Box.Box<never> {
  return Option.match(nextState.error, {
    onNone: () => Box.emptyBox(),
    onSome: (error) =>
      Arr.match(error.split(NEWLINE_REGEX), {
        onEmpty: () => Box.emptyBox(),
        onNonEmpty: (errorLines) => {
          const lines = Arr.map(errorLines, (line) => Box.text(line));
          const prefix = Box.hcat([pointer, Box.text(" ")], Box.left);

          // This is the key composition pattern - using Cmd constants with Box operations
          return Box.hcat(
            [
              Cmd.cursorSavePosition as Box.Box<never>,
              Box.text("\n"), // hardLine equivalent
              prefix,
              Box.alignLeft(Box.vcat(lines, Box.left)),
              Cmd.cursorRestorePosition as Box.Box<never>,
            ],
            Box.left
          );
        },
      }),
  });
}

/**
 * Simple examples demonstrating the composition API without type conflicts
 */

// Example 1: Basic cursor save and restore with text
const simpleMessage = (message: string): Box.Box<never> =>
  Box.hcat(
    [
      Cmd.cursorSavePosition as Box.Box<never>,
      Box.text(message),
      Cmd.cursorRestorePosition as Box.Box<never>,
    ],
    Box.left
  );

// Example 2: Multi-line layout with cursor commands
const multiLineLayout = (lines: string[]): Box.Box<never> => {
  const textBoxes = lines.map(Box.text);
  const content = Box.vcat(textBoxes, Box.left);

  return Box.hcat(
    [
      Cmd.clearScreen as Box.Box<never>,
      Cmd.home as Box.Box<never>,
      content,
      Box.text("\n"),
    ],
    Box.left
  );
};

// Example 3: Positioned content using cursor positioning
const positionedContent = (
  x: number,
  y: number,
  content: string
): Box.Box<never> =>
  Box.hcat([Cmd.cursorTo(x, y) as Box.Box<never>, Box.text(content)], Box.left);

// Example 4: Screen management sequence
const screenSetup = (): Box.Box<never> =>
  Box.hcat(
    [
      Cmd.clearScreen as Box.Box<never>,
      Cmd.cursorHide as Box.Box<never>,
      Box.text("Screen initialized"),
      Box.text("\n"),
      Cmd.cursorShow as Box.Box<never>,
    ],
    Box.left
  );

/**
 * Demo function that showcases the composition patterns
 */
const demo = Effect.gen(function* () {
  // Demo state
  const errorState: State = {
    error: Option.some(
      "Compilation failed\nType error in main.ts\nExpected string, got number"
    ),
    status: "error",
  };

  const pointer = Box.text("→");

  yield* Effect.log("=== New Composable Cmd API Examples ===");

  // Example 1: Error rendering (original user pattern)
  yield* Effect.log("1. Error Display with cursor save/restore:");
  const errorDisplay = renderError(errorState, pointer);
  yield* Effect.log(Box.render(errorDisplay));

  // Example 2: Simple message
  yield* Effect.log("\n2. Simple message with cursor operations:");
  const simple = simpleMessage("Hello, World!");
  yield* Effect.log(Box.render(simple));

  // Example 3: Multi-line layout
  yield* Effect.log("\n3. Multi-line layout with screen commands:");
  const multiLine = multiLineLayout(["Line 1", "Line 2", "Line 3"]);
  yield* Effect.log(Box.render(multiLine));

  // Example 4: Positioned content
  yield* Effect.log("\n4. Positioned content:");
  const positioned = positionedContent(10, 5, "Positioned at (10,5)");
  yield* Effect.log(Box.render(positioned));

  // Example 5: Screen setup sequence
  yield* Effect.log("\n5. Screen management sequence:");
  const setup = screenSetup();
  yield* Effect.log(Box.render(setup));

  yield* Effect.log(
    "\n=== All examples demonstrate seamless Cmd + Box composition! ==="
  );
});

// Export for potential execution
export {
  demo,
  renderError,
  simpleMessage,
  multiLineLayout,
  positionedContent,
  screenSetup,
};
