/**
 * Static demo showcasing Effect Boxes features for screenshots
 */
import { pipe } from "effect";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";

// Feature 1: Table with colored headers
const createTable = () => {
  const headers = ["Name", "Role", "Status"].map((h) =>
    Box.text(h).pipe(
      Box.alignHoriz(Box.center1, 12),
      Box.annotate(Ansi.combine(Ansi.bold, Ansi.cyan))
    )
  );

  const headerRow = Box.punctuateH(headers, Box.top, Box.text(" \u2502 "));

  const separator = Box.text("\u2500".repeat(42)).pipe(Box.annotate(Ansi.dim));

  const data = [
    ["Alice", "Developer", "Active"],
    ["Bob", "Designer", "Away"],
    ["Charlie", "Manager", "Active"],
  ];

  const dataRows = data.map((row) => {
    const cells = row.map((cell, i) => {
      const base = Box.text(cell).pipe(Box.alignHoriz(Box.left, 12));
      if (i === 2) {
        return cell === "Active"
          ? base.pipe(Box.annotate(Ansi.green))
          : base.pipe(Box.annotate(Ansi.yellow));
      }
      return base;
    });
    return Box.punctuateH(cells, Box.top, Box.text(" \u2502 "));
  });

  return Box.vcat([headerRow, separator, ...dataRows], Box.left);
};

// Feature 2: Color palette showcase
const createColorPalette = () => {
  const colors = [
    { name: "red", style: Ansi.red },
    { name: "green", style: Ansi.green },
    { name: "blue", style: Ansi.blue },
    { name: "yellow", style: Ansi.yellow },
    { name: "magenta", style: Ansi.magenta },
    { name: "cyan", style: Ansi.cyan },
  ];

  const blocks = colors.map(({ name, style }) =>
    Box.text(`  ${name.padEnd(8)}  `).pipe(
      Box.annotate(Ansi.combine(style, Ansi.bold))
    )
  );

  return Box.hcat(blocks, Box.center1);
};

// Feature 3: Nested borders
const createNestedBox = () => {
  const inner = Box.text("Effect Boxes").pipe(
    Box.annotate(Ansi.combine(Ansi.bold, Ansi.colorRGB(255, 165, 0)))
  );

  const withPadding = pipe(
    inner,
    Box.moveUp(1),
    Box.moveDown(1),
    Box.moveLeft(2),
    Box.moveRight(2)
  );

  // Simple border
  const addBorder = <A>(box: Box.Box<A>) => {
    const top = Box.text(`\u250c${"\u2500".repeat(box.cols)}\u2510`);
    const bottom = Box.text(`\u2514${"\u2500".repeat(box.cols)}\u2518`);
    const side = pipe(
      Array.from({ length: box.rows }, () => Box.char("\u2502")),
      (arr) => Box.vcat(arr, Box.left)
    );
    return Box.vcat(
      [top, Box.hcat([side, box, side], Box.top), bottom],
      Box.left
    );
  };

  return addBorder(withPadding).pipe(Box.annotate(Ansi.green));
};

// Combine all features
const title = Box.text("Effect Boxes Demo").pipe(
  Box.annotate(Ansi.combine(Ansi.bold, Ansi.underlined)),
  Box.alignHoriz(Box.center1, 50)
);

const subtitle = Box.text("A functional layout system for terminal UIs").pipe(
  Box.annotate(Ansi.dim),
  Box.alignHoriz(Box.center1, 50)
);

const tableSection = Box.vcat(
  [
    Box.text("Tables & Alignment").pipe(
      Box.annotate(Ansi.combine(Ansi.bold, Ansi.blue))
    ),
    createTable(),
  ],
  Box.left
);

const colorSection = Box.vcat(
  [
    Box.text("ANSI Colors").pipe(
      Box.annotate(Ansi.combine(Ansi.bold, Ansi.blue))
    ),
    createColorPalette(),
  ],
  Box.left
);

const boxSection = Box.vcat(
  [
    Box.text("Box Composition").pipe(
      Box.annotate(Ansi.combine(Ansi.bold, Ansi.blue))
    ),
    createNestedBox(),
  ],
  Box.left
);

const demo = Box.vcat(
  [
    title,
    subtitle,
    Box.nullBox,
    tableSection,
    Box.nullBox,
    colorSection,
    Box.nullBox,
    boxSection,
  ],
  Box.left
);

console.log(Box.renderPrettySync(demo));
