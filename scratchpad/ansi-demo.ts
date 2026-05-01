/**
 * ANSI color showcase demo for documentation screenshot
 */
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";

// Standard colors
const standardColors = [
  { name: "black", style: Ansi.black },
  { name: "red", style: Ansi.red },
  { name: "green", style: Ansi.green },
  { name: "yellow", style: Ansi.yellow },
  { name: "blue", style: Ansi.blue },
  { name: "magenta", style: Ansi.magenta },
  { name: "cyan", style: Ansi.cyan },
  { name: "white", style: Ansi.white },
];

// Background colors
const bgColors = [
  { name: "bgBlack", style: Ansi.combine(Ansi.white, Ansi.bgBlack) },
  { name: "bgRed", style: Ansi.combine(Ansi.white, Ansi.bgRed) },
  { name: "bgGreen", style: Ansi.combine(Ansi.black, Ansi.bgGreen) },
  { name: "bgYellow", style: Ansi.combine(Ansi.black, Ansi.bgYellow) },
  { name: "bgBlue", style: Ansi.combine(Ansi.white, Ansi.bgBlue) },
  { name: "bgMagenta", style: Ansi.combine(Ansi.white, Ansi.bgMagenta) },
  { name: "bgCyan", style: Ansi.combine(Ansi.black, Ansi.bgCyan) },
  { name: "bgWhite", style: Ansi.combine(Ansi.black, Ansi.bgWhite) },
];

// Text attributes
const textAttributes = [
  { name: "bold", style: Ansi.bold },
  { name: "dim", style: Ansi.dim },
  { name: "italic", style: Ansi.italic },
  { name: "underlined", style: Ansi.underlined },
  { name: "strikethrough", style: Ansi.strikethrough },
  { name: "inverse", style: Ansi.inverse },
];

// RGB gradient
const rgbGradient = Array.from({ length: 12 }, (_, i) => {
  const hue = (i / 12) * 360;
  const [r, g, b] = hslToRgb(hue, 1, 0.5);
  return Box.text("\u2588\u2588").pipe(Box.annotate(Ansi.colorRGB(r, g, b)));
});

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

// Build sections
const title = Box.text("ANSI Styling Examples").pipe(
  Box.annotate(Ansi.combine(Ansi.bold, Ansi.underlined)),
  Box.alignHoriz(Box.center1, 50)
);

const fgSection = Box.vcat(
  [
    Box.text("Foreground Colors").pipe(
      Box.annotate(Ansi.combine(Ansi.bold, Ansi.cyan))
    ),
    Box.hcat(
      standardColors.map(({ name, style }) =>
        Box.text(` ${name.padEnd(9)}`).pipe(Box.annotate(style))
      ),
      Box.center1
    ),
  ],
  Box.left
);

const bgSection = Box.vcat(
  [
    Box.text("Background Colors").pipe(
      Box.annotate(Ansi.combine(Ansi.bold, Ansi.cyan))
    ),
    Box.hcat(
      bgColors.map(({ name, style }) =>
        Box.text(` ${name.padEnd(11)}`).pipe(Box.annotate(style))
      ),
      Box.center1
    ),
  ],
  Box.left
);

const attrSection = Box.vcat(
  [
    Box.text("Text Attributes").pipe(
      Box.annotate(Ansi.combine(Ansi.bold, Ansi.cyan))
    ),
    Box.hcat(
      textAttributes.map(({ name, style }) =>
        Box.text(` ${name.padEnd(14)}`).pipe(Box.annotate(style))
      ),
      Box.center1
    ),
  ],
  Box.left
);

const rgbSection = Box.vcat(
  [
    Box.text("RGB True Color").pipe(
      Box.annotate(Ansi.combine(Ansi.bold, Ansi.cyan))
    ),
    Box.hcat(rgbGradient, Box.center1),
  ],
  Box.left
);

// Combined example
const combinedExample = Box.vcat(
  [
    Box.text("Combined Styles").pipe(
      Box.annotate(Ansi.combine(Ansi.bold, Ansi.cyan))
    ),
    Box.hcat(
      [
        Box.text(" Bold + Red ").pipe(
          Box.annotate(Ansi.combine(Ansi.bold, Ansi.red))
        ),
        Box.text(" Italic + Blue ").pipe(
          Box.annotate(Ansi.combine(Ansi.italic, Ansi.blue))
        ),
        Box.text(" Underline + Green ").pipe(
          Box.annotate(Ansi.combine(Ansi.underlined, Ansi.green))
        ),
        Box.text(" Bold + BgYellow ").pipe(
          Box.annotate(Ansi.combine(Ansi.bold, Ansi.black, Ansi.bgYellow))
        ),
      ],
      Box.center1
    ),
  ],
  Box.left
);

const demo = Box.vcat(
  [
    title,
    Box.nullBox,
    fgSection,
    Box.nullBox,
    bgSection,
    Box.nullBox,
    attrSection,
    Box.nullBox,
    rgbSection,
    Box.nullBox,
    combinedExample,
  ],
  Box.left
);

console.log(Box.renderPrettySync(demo));
