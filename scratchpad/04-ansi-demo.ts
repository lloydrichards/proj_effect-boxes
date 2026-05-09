/**
 * ANSI color showcase demo for documentation screenshot
 */
import { Effect, pipe } from "effect";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";

const TABLE_WIDTH = 80;

// Helper: create a row of evenly-sized cells
const row = (
  items: { name: string; style: Ansi.AnsiAnnotation }[]
): Box.Box<Ansi.AnsiStyle> => {
  const cellWidth = Math.floor(TABLE_WIDTH / items.length);
  return Box.hcat(
    items.map(({ name, style }) =>
      pipe(
        Box.text(name),
        Box.truncate(cellWidth, Box.left),
        Box.annotate(style),
        Box.alignHoriz(Box.center1, cellWidth)
      )
    ),
    Box.top
  );
};

// Helper: section header
const header = (text: string): Box.Box<Ansi.AnsiStyle> =>
  pipe(
    Box.text(text),
    Box.annotate(Ansi.combine(Ansi.bold, Ansi.brightCyan)),
    Box.alignHoriz(Box.left, TABLE_WIDTH)
  );

// Helper: separator
const sep = Box.text("─".repeat(TABLE_WIDTH));

// Standard foreground
const fgColors = [
  { name: "black", style: Ansi.black },
  { name: "red", style: Ansi.red },
  { name: "green", style: Ansi.green },
  { name: "yellow", style: Ansi.yellow },
  { name: "blue", style: Ansi.blue },
  { name: "magenta", style: Ansi.magenta },
  { name: "cyan", style: Ansi.cyan },
  { name: "white", style: Ansi.white },
];

// Bright foreground
const brightFgColors = [
  { name: "brBlack", style: Ansi.brightBlack },
  { name: "brRed", style: Ansi.brightRed },
  { name: "brGreen", style: Ansi.brightGreen },
  { name: "brYellow", style: Ansi.brightYellow },
  { name: "brBlue", style: Ansi.brightBlue },
  { name: "brMagenta", style: Ansi.brightMagenta },
  { name: "brCyan", style: Ansi.brightCyan },
  { name: "brWhite", style: Ansi.brightWhite },
];

// Background
const bgColors = [
  { name: "bgBlack", style: Ansi.combine(Ansi.white, Ansi.bgBlack) },
  { name: "bgRed", style: Ansi.combine(Ansi.black, Ansi.bgRed) },
  { name: "bgGreen", style: Ansi.combine(Ansi.black, Ansi.bgGreen) },
  { name: "bgYellow", style: Ansi.combine(Ansi.black, Ansi.bgYellow) },
  { name: "bgBlue", style: Ansi.combine(Ansi.black, Ansi.bgBlue) },
  { name: "bgMagenta", style: Ansi.combine(Ansi.black, Ansi.bgMagenta) },
  { name: "bgCyan", style: Ansi.combine(Ansi.black, Ansi.bgCyan) },
  { name: "bgWhite", style: Ansi.combine(Ansi.black, Ansi.bgWhite) },
];

// Bright background
const bgBrightColors = [
  { name: "bgBrightBlack", style: Ansi.combine(Ansi.white, Ansi.bgBrightBlack) },
  { name: "bgBrightRed", style: Ansi.combine(Ansi.black, Ansi.bgBrightRed) },
  { name: "bgBrightGreen", style: Ansi.combine(Ansi.black, Ansi.bgBrightGreen) },
  { name: "bgBrightYellow", style: Ansi.combine(Ansi.black, Ansi.bgBrightYellow) },
  { name: "bgBrightBlue", style: Ansi.combine(Ansi.black, Ansi.bgBrightBlue) },
  { name: "bgBrightMagenta", style: Ansi.combine(Ansi.black, Ansi.bgBrightMagenta) },
  { name: "bgBrightCyan", style: Ansi.combine(Ansi.black, Ansi.bgBrightCyan) },
  { name: "bgBrightWhite", style: Ansi.combine(Ansi.black, Ansi.bgBrightWhite) },
];

// Text attributes
const textAttrs = [
  { name: "bold", style: Ansi.bold },
  { name: "dim", style: Ansi.dim },
  { name: "italic", style: Ansi.italic },
  { name: "underlined", style: Ansi.underlined },
  { name: "strikethrough", style: Ansi.strikethrough },
  { name: "inverse", style: Ansi.inverse },
];

// RGB gradient
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

const rgbBlocks = Array.from({ length: TABLE_WIDTH / 2 }, (_, i) => {
  const hue = (i / (TABLE_WIDTH / 2)) * 360;
  const [r, g, b] = hslToRgb(hue, 1, 0.5);
  return pipe(Box.text("\u2588\u2588"), Box.annotate(Ansi.colorRGB(r, g, b)));
});

const rgbRow = Box.hcat(rgbBlocks, Box.top);

// Border styles
const borderRow = Box.hcat(
  [
    pipe(Box.text("single"), Box.pad(0, 1), Box.border("single")),
    Box.text(" "),
    pipe(Box.text("rounded"), Box.pad(0, 1), Box.border("rounded")),
    Box.text(" "),
    pipe(Box.text("double"), Box.pad(0, 1), Box.border("double")),
    Box.text(" "),
    pipe(Box.text("thick"), Box.pad(0, 1), Box.border("thick")),
    Box.text(" "),
    pipe(Box.text("ascii"), Box.pad(0, 1), Box.border("ascii")),
  ],
  Box.top
);

// Colored borders
const coloredBorderRow = Box.hcat(
  [
    pipe(
      Box.text("Error"),
      Box.pad(0, 1),
      Box.border("rounded", { annotation: Ansi.red })
    ),
    Box.text(" "),
    pipe(
      Box.text("Success"),
      Box.pad(0, 1),
      Box.border("rounded", { annotation: Ansi.green })
    ),
    Box.text(" "),
    pipe(
      Box.text("Warning"),
      Box.pad(0, 1),
      Box.border("rounded", { annotation: Ansi.yellow })
    ),
    Box.text(" "),
    pipe(
      Box.text("Info"),
      Box.pad(0, 1),
      Box.border("rounded", { annotation: Ansi.brightBlue })
    ),
  ],
  Box.top
);

// Title
const title = pipe(
  Box.text("ANSI Styling Examples"),
  Box.annotate(Ansi.combine(Ansi.bold, Ansi.underlined)),
  Box.alignHoriz(Box.center1, TABLE_WIDTH)
);

// Assemble table
const demo = Box.vcat(
  [
    title,
    sep,
    header("Foreground Colors"),
    row(fgColors),
    Box.nullBox,
    header("Bright Foreground Colors"),
    row(brightFgColors),
    sep,
    header("Background Colors"),
    row(bgColors),
    Box.nullBox,
    header("Bright Background Colors"),
    row(bgBrightColors),
    sep,
    header("Text Attributes"),
    row(textAttrs),
    sep,
    header("RGB True Color"),
    rgbRow,
    sep,
    header("Border Styles"),
    borderRow,
    Box.nullBox,
    header("Colored Borders"),
    coloredBorderRow,
  ],
  Box.left
).pipe(Box.pad(2));

export const main = Effect.sync(() => console.log(Box.renderPrettySync(demo)));
