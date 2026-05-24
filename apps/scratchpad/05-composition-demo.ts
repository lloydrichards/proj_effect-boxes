/**
 * @fileoverview Example demonstrating the composable Cmd API pattern.
 *
 * Shows how zero-dimension Cmd boxes (cursor commands) compose seamlessly
 * with visible Box content using combine, hcat, and combineAll.
 */

import { Console, pipe } from "effect";
import * as Ansi from "effect-boxes/Ansi";
import * as Box from "effect-boxes/Box";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const section = (
  n: number,
  title: string,
  description: string,
  content: Box.Box<Ansi.AnsiStyle>
) =>
  Box.vcat(
    [
      Box.text(`${n}. ${title}`).pipe(
        Box.annotate(Ansi.combine(Ansi.bold, Ansi.cyan))
      ),
      Box.text(`   ${description}`).pipe(Box.annotate(Ansi.dim)),
      content.pipe(Box.pad(0, 1), Box.border("rounded")),
      Box.nullBox,
    ],
    Box.left
  );

// ---------------------------------------------------------------------------
// Example 1: combineAll for inline styled segments
// ---------------------------------------------------------------------------

const styledInline = () =>
  Box.combineAll([
    Box.text("before ").pipe(Box.annotate(Ansi.dim)),
    Box.text("HIGHLIGHT").pipe(
      Box.annotate(Ansi.combine(Ansi.bold, Ansi.yellow))
    ),
    Box.text(" after").pipe(Box.annotate(Ansi.dim)),
  ]);

// ---------------------------------------------------------------------------
// Example 2: Error display with pointer prefix
// ---------------------------------------------------------------------------

const errorDisplay = () => {
  const pointer = Box.text("→").pipe(Box.annotate(Ansi.yellow));
  const errorLines = [
    "Compilation failed",
    "Type error in main.ts",
    "Expected string, got number",
  ];

  return Box.hcat(
    [
      pointer,
      Box.text(" "),
      Box.vcat(
        errorLines.map((line) => Box.text(line).pipe(Box.annotate(Ansi.red))),
        Box.left
      ),
    ],
    Box.left
  );
};

// ---------------------------------------------------------------------------
// Example 3: Status line via combineAll
// ---------------------------------------------------------------------------

const statusLine = () =>
  Box.combineAll([
    Box.text("[").pipe(Box.annotate(Ansi.dim)),
    Box.text("OK").pipe(Box.annotate(Ansi.combine(Ansi.bold, Ansi.green))),
    Box.text("] ").pipe(Box.annotate(Ansi.dim)),
    Box.text("Build completed in "),
    Box.text("1.23s").pipe(Box.annotate(Ansi.cyan)),
  ]);

// ---------------------------------------------------------------------------
// Example 4: Nested horizontal + vertical composition
// ---------------------------------------------------------------------------

const nestedComposition = () => {
  const left = Box.vcat(
    [
      Box.text("Name").pipe(Box.annotate(Ansi.bold)),
      Box.text("Alice"),
      Box.text("Bob"),
    ],
    Box.left
  );

  const right = Box.vcat(
    [
      Box.text("Role").pipe(Box.annotate(Ansi.bold)),
      Box.text("Dev").pipe(Box.annotate(Ansi.green)),
      Box.text("Design").pipe(Box.annotate(Ansi.magenta)),
    ],
    Box.left
  );

  return Box.punctuateH([left, right], Box.top, Box.text(" │ "));
};

// ---------------------------------------------------------------------------
// Example 5: Inline annotations as a status bar
// ---------------------------------------------------------------------------

const inlineAnnotations = () => {
  const label = Box.text("Status: ").pipe(Box.annotate(Ansi.bold));
  const value = Box.text("Active").pipe(
    Box.annotate(Ansi.combine(Ansi.green, Ansi.bold))
  );
  const separator = Box.text(" | ").pipe(Box.annotate(Ansi.dim));
  const label2 = Box.text("Uptime: ").pipe(Box.annotate(Ansi.bold));
  const value2 = Box.text("3h 42m").pipe(Box.annotate(Ansi.cyan));

  return Box.combineAll([label, value, separator, label2, value2]);
};

// ---------------------------------------------------------------------------
// Demo
// ---------------------------------------------------------------------------

export const main = Console.log(
  Box.renderPrettySync(
    Box.vcat(
      [
        Box.text("Composable Box API Examples").pipe(
          Box.annotate(Ansi.combine(Ansi.bold, Ansi.underlined))
        ),
        Box.text("Building rich layouts by composing small styled pieces").pipe(
          Box.annotate(Ansi.dim)
        ),
        Box.nullBox,
        section(
          1,
          "Inline styled segments",
          "combineAll joins annotated text fragments into a single line",
          styledInline()
        ),
        section(
          2,
          "Error display with pointer prefix",
          "hcat composes a pointer, spacing, and multi-line error text",
          errorDisplay()
        ),
        section(
          3,
          "Status line via combineAll",
          "Inline composition of styled segments into a status message",
          statusLine()
        ),
        section(
          4,
          "Nested horizontal + vertical composition",
          "punctuateH joins two vcat columns with a separator",
          nestedComposition()
        ),
        section(
          5,
          "Inline annotations as a status bar",
          "combineAll builds a rich status bar from small styled pieces",
          inlineAnnotations()
        ),
      ],
      Box.left
    )
  )
);
