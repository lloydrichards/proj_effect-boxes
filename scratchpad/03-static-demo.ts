/**
 * Static demo showcasing the powerful layout capabilities of Effect Boxes.
 *
 * Demonstrates: word wrapping (para), multi-column text flow (columns),
 * alignment modes, horizontal bar charts, and positional offsets (move*).
 */
import { Effect } from "effect";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOTAL_WIDTH = 76;

const sectionLabel = (label: string) =>
  Box.text(` ${label} `).pipe(
    Box.annotate(
      Ansi.combine(Ansi.bold, Ansi.bgColorRGB(45, 85, 155), Ansi.white)
    )
  );

const dimRule = (width: number) =>
  Box.text("─".repeat(width)).pipe(Box.annotate(Ansi.dim));

// ---------------------------------------------------------------------------
// 1. Header
// ---------------------------------------------------------------------------

const header = Box.text("Effect Boxes").pipe(
  Box.annotate(Ansi.combine(Ansi.bold, Ansi.colorRGB(255, 165, 0))),
  Box.pad(0, 1),
  Box.border("rounded", { annotation: Ansi.dim }),
  Box.alignHoriz(Box.center1, TOTAL_WIDTH)
);

const subtitle = Box.text(
  "A functional layout engine for composable terminal UIs"
).pipe(Box.annotate(Ansi.dim), Box.alignHoriz(Box.center1, TOTAL_WIDTH));

// ---------------------------------------------------------------------------
// 2. Word Wrapping — same text at different widths
// ---------------------------------------------------------------------------

const WRAP_TEXT =
  "Effect Boxes provides automatic word wrapping through the para function. " +
  "The same input text reflows to fit any target width, making responsive " +
  "terminal layouts easy to build.";

const wrapWidths = [20, 28, 38] as const;

const wrapDemo = (() => {
  const wrapped = wrapWidths.map((w) =>
    Box.vcat(
      [
        Box.text(`width=${w}`).pipe(
          Box.annotate(Ansi.combine(Ansi.bold, Ansi.cyan)),
          Box.alignHoriz(Box.center1, w)
        ),
        dimRule(w),
        Box.para(WRAP_TEXT, Box.left, w),
      ],
      Box.left
    ).pipe(Box.border("rounded", { annotation: Ansi.dim }))
  );

  return Box.vcat(
    [sectionLabel("Word Wrapping (para)"), Box.hsep(wrapped, 2, Box.top)],
    Box.left
  );
})();

// ---------------------------------------------------------------------------
// 3. Multi-column text flow (columns)
// ---------------------------------------------------------------------------

const ARTICLE_TEXT =
  "Functional composition is the backbone of Effect Boxes. Every box is an " +
  "immutable value that can be combined, aligned, padded, and annotated " +
  "without mutation. Horizontal and vertical concatenation let you build " +
  "complex layouts from small, reusable pieces. Borders, separators, and " +
  "annotations add visual structure. The library draws inspiration from " +
  "Haskell's Text.PrettyPrint.Boxes, adapted for the Effect ecosystem " +
  "with full TypeScript type safety, pipeable APIs, and ANSI rendering.";

const columnDemo = (() => {
  const colWidth = 22;
  const colHeight = 8;

  return Box.vcat(
    [
      sectionLabel("Multi-Column Flow (columns)"),
      Box.punctuateH(
        Box.columns(ARTICLE_TEXT, Box.left, colWidth, colHeight),
        Box.top,
        Box.text("│\n".repeat(colHeight).trimEnd()).pipe(
          Box.annotate(Ansi.dim),
          Box.pad(0, 1)
        )
      ),
    ],
    Box.left
  );
})();

// ---------------------------------------------------------------------------
// 4. Alignment Showcase
// ---------------------------------------------------------------------------

const alignmentDemo = (() => {
  const W = 15; // odd width so center1 vs center2 bias is visible
  const modes: Array<[string, Box.Alignment]> = [
    ["left", Box.left],
    ["center1", Box.center1],
    ["center2", Box.center2],
    ["right", Box.right],
  ];

  // "ABCD" is 4 chars in a 15-wide box = 11 leftover (odd)
  // center1 bias left:  5 spaces + ABCD + 6 spaces
  // center2 bias right: 6 spaces + ABCD + 5 spaces
  const makeRow = (
    txt: string,
    align: Box.Alignment,
    color: Ansi.AnsiAnnotation
  ) => {
    const aligned = Box.text(txt).pipe(Box.alignHoriz(align, W));
    return Box.text(
      Box.renderPlainSync(aligned).trimEnd().padEnd(W).replace(/ /g, "·")
    ).pipe(Box.annotate(color));
  };

  const boxes = modes.map(([name, align]) =>
    Box.vcat(
      [
        Box.text(name).pipe(
          Box.alignHoriz(Box.center1, W),
          Box.annotate(Ansi.combine(Ansi.bold, Ansi.cyan))
        ),
        dimRule(W),
        makeRow("AB", align, Ansi.green),
        makeRow("ABC", align, Ansi.yellow),
        makeRow("ABCD", align, Ansi.magenta),
      ],
      Box.left
    ).pipe(Box.pad(0, 1), Box.border("single", { annotation: Ansi.dim }))
  );

  return Box.vcat(
    [sectionLabel("Alignment Modes"), Box.hcat(boxes, Box.top)],
    Box.left
  );
})();

// ---------------------------------------------------------------------------
// 5. Horizontal Bar Chart
// ---------------------------------------------------------------------------

const barChartDemo = (() => {
  const data: Array<[string, number]> = [
    ["Rust", 92],
    ["TypeScript", 78],
    ["Python", 65],
    ["Go", 54],
    ["Haskell", 41],
    ["Lua", 28],
  ];

  const maxVal = Math.max(...data.map(([, v]) => v));
  const barMaxWidth = 40;

  const barColors: Ansi.AnsiAnnotation[] = [
    Ansi.colorRGB(255, 100, 70),
    Ansi.colorRGB(70, 150, 255),
    Ansi.colorRGB(100, 220, 100),
    Ansi.colorRGB(0, 200, 200),
    Ansi.colorRGB(180, 130, 255),
    Ansi.colorRGB(255, 200, 60),
  ];

  const rows = data.map(([label, value], i) => {
    const barWidth = Math.round((value / maxVal) * barMaxWidth);
    return Box.hsep(
      [
        Box.text(label).pipe(Box.alignHoriz(Box.right, 12)),
        Box.text("█".repeat(barWidth)).pipe(Box.annotate(barColors[i]!)),
        Box.text(`${value}`).pipe(Box.annotate(Ansi.dim)),
      ],
      1,
      Box.top
    );
  });

  return Box.vcat(
    [sectionLabel("Bar Chart (scaling with layout width)"), ...rows],
    Box.left
  );
})();

// ---------------------------------------------------------------------------
// 6. Positional Offsets (moveRight / moveDown)
// ---------------------------------------------------------------------------

const positionDemo = (() => {
  const makeTag = (label: string, color: Ansi.AnsiAnnotation) =>
    Box.text(label).pipe(
      Box.annotate(Ansi.combine(Ansi.bold, color)),
      Box.pad(0, 1),
      Box.border("rounded"),
      Box.annotate(color)
    );

  const a = makeTag("origin", Ansi.green);
  const b = Box.moveRight(makeTag("moveRight(28)", Ansi.magenta), 28);
  const c = Box.moveRight(makeTag("moveRight(12)", Ansi.cyan), 12);

  // Stack them — each box carries its own offset so they form a staircase
  const stacked = Box.vcat([a, b, c], Box.left);

  return Box.vcat(
    [sectionLabel("Positioning (moveRight / moveDown)"), stacked],
    Box.left
  );
})();

// ---------------------------------------------------------------------------
// 7. Per-Side Border Toggles
// ---------------------------------------------------------------------------

const borderSidesDemo = (() => {
  // Tabbed interface (Lip Gloss style): all tabs skip the bottom border,
  // a connector line joins them to the content panel using junction chars.
  const labels = ["Overview", "Details", "Settings"];
  const activeIndex = 2;

  const tabBoxes = labels.map((label, i) =>
    Box.text(label).pipe(
      Box.pad(0, 1),
      Box.border("rounded", {
        sides: { bottom: false },
        annotation: i === activeIndex ? Ansi.cyan : Ansi.dim,
      }),
      i === activeIndex
        ? Box.annotate(Ansi.combine(Ansi.bold, Ansi.cyan))
        : (x) => x
    )
  );

  const tabs = Box.hcat(tabBoxes, Box.top);

  // Active tab gets a gap (spaces), inactive tabs get ─ with ┴ at junctions
  let connector = "";
  for (let i = 0; i < labels.length; i++) {
    const innerWidth = tabBoxes[i]!.cols - 2;
    const isActive = i === activeIndex;

    // Left edge or junction
    if (i === 0) {
      connector += isActive ? "│" : "├";
    } else {
      // Two chars for the junction (replacing ││ from adjacent tab borders)
      const prevActive = i - 1 === activeIndex;
      if (prevActive) {
        // active → inactive: close active's corner, tee for inactive
        connector += "╰┴";
      } else if (isActive) {
        // inactive → active: tee for inactive, close corner into active
        connector += "┴╯";
      } else {
        // both inactive
        connector += "┴┴";
      }
    }

    connector += isActive ? " ".repeat(innerWidth) : "─".repeat(innerWidth);
  }
  // Right edge
  connector += activeIndex === labels.length - 1 ? "│" : "┤";

  const connectorLine = Box.text(connector).pipe(Box.annotate(Ansi.cyan));

  // Content panel: width matches tabs
  const tabContent = Box.para(
    "This panel joins seamlessly with the active tab above " +
      "because the tab's bottom border is disabled.",
    Box.left,
    tabs.cols - 4 // -2 border -2 padding
  ).pipe(
    Box.pad(0, 1),
    Box.border("rounded", {
      sides: { top: false },
      annotation: Ansi.cyan,
    })
  );

  const tabSection = Box.vcat([tabs, connectorLine, tabContent], Box.left);

  return Box.vcat([sectionLabel("Border Layouts"), tabSection], Box.left);
})();

// ---------------------------------------------------------------------------
// Assemble
// ---------------------------------------------------------------------------

const demo = Box.vsep(
  [
    header,
    subtitle,
    wrapDemo,
    columnDemo,
    alignmentDemo,
    barChartDemo,
    positionDemo,
    borderSidesDemo,
  ],
  1,
  Box.left
);

export const main = Effect.sync(() => console.log(Box.renderPrettySync(demo)));
