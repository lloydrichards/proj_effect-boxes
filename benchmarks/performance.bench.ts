/** biome-ignore-all lint/suspicious/noConsole: Testing files */
import { Array, pipe } from "effect";
import { bench, describe } from "vitest";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";
import * as AnsiInternal from "../src/internal/ansi";
import * as BoxInternal from "../src/internal/box";
import * as Width from "../src/internal/width";

// Data generation
const generateAsciiText = (size: number): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?";
  return Array.makeBy(
    size,
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};
const generateUnicodeText = (size: number): string => {
  const chars = "你好世界こんにちは안녕하세요привет🌍🚀✨💡🎯📚⭐️🔥";
  return Array.makeBy(
    size,
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};
const generateMixedText = (size: number): string => {
  const ascii = "Hello world test ";
  const unicode = "你好 こんにちは ";
  const emoji = "🌍🚀✨💡🎯📚⭐️🔥 ";
  const combined = ascii + unicode + emoji;

  let result = "";
  while (result.length < size) {
    result += combined.substring(
      0,
      Math.min(combined.length, size - result.length)
    );
  }
  return result.substring(0, size);
};
const generateAnsiText = (size: number): string => {
  const colors = [
    "\x1b[31m", // red
    "\x1b[32m", // green
    "\x1b[33m", // yellow
    "\x1b[34m", // blue
    "\x1b[35m", // magenta
    "\x1b[36m", // cyan
  ];
  const reset = "\x1b[0m";
  const baseText = generateAsciiText(size);

  let result = "";
  let colorIndex = 0;
  for (let i = 0; i < baseText.length; i += 10) {
    const chunk = baseText.substring(i, i + 10);
    result += colors[colorIndex % colors.length] + chunk + reset;
    colorIndex++;
  }
  return result;
};
const generateComplexAnsiText = (size: number): string => {
  const styles = [
    "\x1b[1;31m", // bold red
    "\x1b[3;32m", // italic green
    "\x1b[4;33m", // underline yellow
    "\x1b[1;4;34m", // bold underline blue
    "\x1b[2;35m", // dim magenta
  ];
  const reset = "\x1b[0m";
  const baseText = generateAsciiText(size);

  let result = "";
  let styleIndex = 0;
  for (let i = 0; i < baseText.length; i += 5) {
    const chunk = baseText.substring(i, i + 5);
    result += styles[styleIndex % styles.length] + chunk + reset;
    styleIndex++;
  }
  return result;
};

// Test data sets
const TestData = {
  small: {
    ascii: generateAsciiText(100),
    unicode: generateUnicodeText(100),
    mixed: generateMixedText(100),
    ansi: generateAnsiText(100),
    complexAnsi: generateComplexAnsiText(100),
  },
  medium: {
    ascii: generateAsciiText(1000),
    unicode: generateUnicodeText(1000),
    mixed: generateMixedText(1000),
    ansi: generateAnsiText(1000),
    complexAnsi: generateComplexAnsiText(1000),
  },
  large: {
    ascii: generateAsciiText(5000),
    unicode: generateUnicodeText(5000),
    mixed: generateMixedText(5000),
    ansi: generateAnsiText(5000),
    complexAnsi: generateComplexAnsiText(5000),
  },
  xlarge: {
    ascii: generateAsciiText(10_000),
    unicode: generateUnicodeText(10_000),
    mixed: generateMixedText(10_000),
    ansi: generateAnsiText(10_000),
    complexAnsi: generateComplexAnsiText(10_000),
  },
};
const generateBoxArrays = () => {
  const small = Array.makeBy(5, (i) => Box.text(`Box ${i}\nLine 2`));
  const medium = Array.makeBy(20, (i) =>
    Box.text(`Box ${i}\nSecond line\nThird line`)
  );
  const large = Array.makeBy(50, (i) =>
    Box.text(`Box ${i}\n${generateAsciiText(50)}\n${generateAsciiText(30)}`)
  );
  const xlarge = Array.makeBy(100, (i) =>
    Box.text(`Box ${i}\n${generateAsciiText(100)}`)
  );
  return { small, medium, large, xlarge };
};

const boxArrays = generateBoxArrays();

describe("Width Calculation Benchmarks", () => {
  describe("Width.ofString", () => {
    bench(
      "ASCII small (100 chars)",
      () => {
        Width.ofString(TestData.small.ascii);
      },
      { time: 1000 }
    );

    bench(
      "ASCII medium (1000 chars)",
      () => {
        Width.ofString(TestData.medium.ascii);
      },
      { time: 1000 }
    );

    bench(
      "ASCII large (5000 chars)",
      () => {
        Width.ofString(TestData.large.ascii);
      },
      { time: 1000 }
    );

    bench(
      "Unicode small (100 chars)",
      () => {
        Width.ofString(TestData.small.unicode);
      },
      { time: 1000 }
    );

    bench(
      "Unicode medium (1000 chars)",
      () => {
        Width.ofString(TestData.medium.unicode);
      },
      { time: 1000 }
    );

    bench(
      "Unicode large (5000 chars)",
      () => {
        Width.ofString(TestData.large.unicode);
      },
      { time: 1000 }
    );

    bench(
      "Mixed small (100 chars)",
      () => {
        Width.ofString(TestData.small.mixed);
      },
      { time: 1000 }
    );

    bench(
      "Mixed medium (1000 chars)",
      () => {
        Width.ofString(TestData.medium.mixed);
      },
      { time: 1000 }
    );

    bench(
      "Mixed large (5000 chars)",
      () => {
        Width.ofString(TestData.large.mixed);
      },
      { time: 1000 }
    );

    bench(
      "ANSI small (100 chars)",
      () => {
        Width.ofString(TestData.small.ansi);
      },
      { time: 1000 }
    );

    bench(
      "ANSI medium (1000 chars)",
      () => {
        Width.ofString(TestData.medium.ansi);
      },
      { time: 1000 }
    );

    bench(
      "ANSI large (5000 chars)",
      () => {
        Width.ofString(TestData.large.ansi);
      },
      { time: 1000 }
    );

    bench(
      "Complex ANSI small (100 chars)",
      () => {
        Width.ofString(TestData.small.complexAnsi);
      },
      { time: 1000 }
    );

    bench(
      "Complex ANSI medium (1000 chars)",
      () => {
        Width.ofString(TestData.medium.complexAnsi);
      },
      { time: 1000 }
    );
  });

  describe("Width.segments", () => {
    bench(
      "ASCII medium (1000 chars)",
      () => {
        Width.segments(TestData.medium.ascii);
      },
      { time: 1000 }
    );

    bench(
      "Unicode medium (1000 chars)",
      () => {
        Width.segments(TestData.medium.unicode);
      },
      { time: 1000 }
    );

    bench(
      "Mixed medium (1000 chars)",
      () => {
        Width.segments(TestData.medium.mixed);
      },
      { time: 1000 }
    );
  });
});

describe("Box Merging Benchmarks", () => {
  describe("Box.hcat", () => {
    bench(
      "small array (5 boxes)",
      () => {
        Box.hcat(boxArrays.small, Box.top);
      },
      { time: 1000 }
    );

    bench(
      "medium array (20 boxes)",
      () => {
        Box.hcat(boxArrays.medium, Box.top);
      },
      { time: 1000 }
    );

    bench(
      "large array (50 boxes)",
      () => {
        Box.hcat(boxArrays.large, Box.top);
      },
      { time: 1000 }
    );

    bench(
      "xlarge array (100 boxes)",
      () => {
        Box.hcat(boxArrays.xlarge, Box.top);
      },
      { time: 1000 }
    );
  });

  describe("Box.vcat", () => {
    bench(
      "small array (5 boxes)",
      () => {
        Box.vcat(boxArrays.small, Box.left);
      },
      { time: 1000 }
    );

    bench(
      "medium array (20 boxes)",
      () => {
        Box.vcat(boxArrays.medium, Box.left);
      },
      { time: 1000 }
    );

    bench(
      "large array (50 boxes)",
      () => {
        Box.vcat(boxArrays.large, Box.left);
      },
      { time: 1000 }
    );

    bench(
      "xlarge array (100 boxes)",
      () => {
        Box.vcat(boxArrays.xlarge, Box.left);
      },
      { time: 1000 }
    );
  });

  describe("BoxInternal.merge", () => {
    bench(
      "small rendered boxes (5)",
      () => {
        BoxInternal.merge(
          boxArrays.small.map((box) =>
            Box.renderSync(box, Box.pretty).split("\n")
          )
        );
      },
      { time: 1000 }
    );

    bench(
      "medium rendered boxes (20)",
      () => {
        BoxInternal.merge(
          boxArrays.medium.map((box) =>
            Box.renderSync(box, Box.pretty).split("\n")
          )
        );
      },
      { time: 1000 }
    );

    bench(
      "large rendered boxes (50)",
      () => {
        BoxInternal.merge(
          boxArrays.large.map((box) =>
            Box.renderSync(box, Box.pretty).split("\n")
          )
        );
      },
      { time: 1000 }
    );
  });

  describe("Box.render", () => {
    bench(
      "nested small structure",
      () => {
        Box.renderSync(
          Box.vcat(
            [
              Box.hcat(boxArrays.small.slice(0, 3), Box.top),
              Box.hcat(boxArrays.small.slice(2, 5), Box.top),
            ],
            Box.left
          ),
          Box.pretty
        );
      },
      { time: 1000 }
    );

    bench(
      "nested medium structure",
      () => {
        Box.renderSync(
          Box.vcat(
            [
              Box.hcat(boxArrays.medium.slice(0, 10), Box.top),
              Box.hcat(boxArrays.medium.slice(10, 20), Box.top),
            ],
            Box.left
          ),
          Box.pretty
        );
      },
      { time: 1000 }
    );
  });

  describe("Box Alignment", () => {
    bench(
      "Box.alignHoriz - medium box",
      () => {
        Box.alignHoriz(boxArrays.medium[0], Box.center1, 100);
      },
      { time: 1000 }
    );

    bench(
      "Box.alignVert - medium box",
      () => {
        Box.alignVert(boxArrays.medium[0], Box.center1, 50);
      },
      { time: 1000 }
    );

    bench(
      "Box.moveRight - medium box",
      () => {
        Box.moveRight(boxArrays.medium[0], 10);
      },
      { time: 1000 }
    );

    bench(
      "Box.moveDown - medium box",
      () => {
        Box.moveDown(boxArrays.medium[0], 5);
      },
      { time: 1000 }
    );
  });
});

describe("ANSI Processing Benchmarks", () => {
  describe("AnsiInternal.truncatePreservingAnsi", () => {
    bench(
      "ANSI small",
      () => {
        AnsiInternal.truncatePreservingAnsi(TestData.small.ansi, 50);
      },
      { time: 1000 }
    );

    bench(
      "ANSI medium",
      () => {
        AnsiInternal.truncatePreservingAnsi(TestData.medium.ansi, 500);
      },
      { time: 1000 }
    );

    bench(
      "ANSI large",
      () => {
        AnsiInternal.truncatePreservingAnsi(TestData.large.ansi, 2500);
      },
      { time: 1000 }
    );

    bench(
      "Complex ANSI small",
      () => {
        AnsiInternal.truncatePreservingAnsi(TestData.small.complexAnsi, 50);
      },
      { time: 1000 }
    );

    bench(
      "Complex ANSI medium",
      () => {
        AnsiInternal.truncatePreservingAnsi(TestData.medium.complexAnsi, 500);
      },
      { time: 1000 }
    );
  });

  describe("AnsiInternal.padPreservingAnsi", () => {
    bench(
      "ANSI small",
      () => {
        AnsiInternal.padPreservingAnsi(TestData.small.ansi, 150, Box.center1);
      },
      { time: 1000 }
    );

    bench(
      "ANSI medium",
      () => {
        AnsiInternal.padPreservingAnsi(TestData.medium.ansi, 1500, Box.center1);
      },
      { time: 1000 }
    );

    bench(
      "Complex ANSI small",
      () => {
        AnsiInternal.padPreservingAnsi(
          TestData.small.complexAnsi,
          150,
          Box.center1
        );
      },
      { time: 1000 }
    );
  });

  describe("AnsiInternal.getAnsiEscapeSequence", () => {
    bench(
      "simple",
      () => {
        AnsiInternal.getAnsiEscapeSequence(Ansi.red.data);
      },
      { time: 1000 }
    );

    bench(
      "combined",
      () => {
        AnsiInternal.getAnsiEscapeSequence(
          Ansi.combine(Ansi.bold, Ansi.red).data
        );
      },
      { time: 1000 }
    );

    bench(
      "complex",
      () => {
        AnsiInternal.getAnsiEscapeSequence(
          Ansi.combine(Ansi.bold, Ansi.underlined, Ansi.red, Ansi.bgYellow).data
        );
      },
      { time: 1000 }
    );
  });

  describe("AnsiInternal.applyAnsiStyling", () => {
    const testLines = ["Line 1", "Line 2 with more text", "Line 3"];
    bench(
      "simple lines",
      () => {
        AnsiInternal.applyAnsiStyling(testLines, "\x1b[31m");
      },
      { time: 1000 }
    );

    bench(
      "complex escape",
      () => {
        AnsiInternal.applyAnsiStyling(testLines, "\x1b[1;4;31;43m");
      },
      { time: 1000 }
    );
  });

  describe("AnsiInternal.renderAnnotatedBox", () => {
    bench(
      "simple ANSI",
      () => {
        AnsiInternal.renderAnnotatedBox(
          pipe(Box.text(TestData.small.ascii), Box.annotate(Ansi.red))
        );
      },
      { time: 1000 }
    );

    bench(
      "complex ANSI",
      () => {
        AnsiInternal.renderAnnotatedBox(
          pipe(
            Box.text(TestData.medium.ascii),
            Box.annotate(
              Ansi.combine(Ansi.bold, Ansi.underlined, Ansi.red, Ansi.bgYellow)
            )
          )
        );
      },
      { time: 1000 }
    );
  });

  describe("Ansi.combine", () => {
    bench(
      "multiple styles",
      () => {
        Ansi.combine(Ansi.red, Ansi.bold, Ansi.underlined, Ansi.bgBlue);
      },
      { time: 1000 }
    );

    bench(
      "conflicting styles",
      () => {
        Ansi.combine(Ansi.red, Ansi.green, Ansi.blue, Ansi.bgRed, Ansi.bgGreen);
      },
      { time: 1000 }
    );
  });
});

describe("Integrated Performance Benchmarks", () => {
  // Scenario 1: Large document with mixed content
  const createLargeDocument = () => {
    const sections = Array.makeBy(10, (i) => {
      const title = Box.text(`Section ${i + 1}`);
      const content = Box.text(TestData.medium.mixed);
      return Box.vcat([title, content], Box.left);
    });
    return Box.vcat(sections, Box.left);
  };

  bench(
    "Large document creation",
    () => {
      createLargeDocument();
    },
    { time: 1000 }
  );

  bench(
    "Large document rendering",
    () => {
      const doc = createLargeDocument();
      Box.renderSync(doc, Box.pretty);
    },
    { time: 1000 }
  );

  const createColoredTable = () => {
    const headers = ["Name", "Age", "City", "Status"];
    const headerBoxes = headers.map((h) =>
      pipe(
        Box.text(h),
        Box.annotate(Ansi.combine(Ansi.bold, Ansi.white, Ansi.bgBlue))
      )
    );

    const rows = Array.makeBy(20, (i) => {
      const name = pipe(Box.text(`User${i}`), Box.annotate(Ansi.cyan));
      const age = pipe(Box.text(`${20 + i}`), Box.annotate(Ansi.yellow));
      const city = pipe(Box.text(`City${i % 5}`), Box.annotate(Ansi.green));
      const status = pipe(
        Box.text(i % 2 === 0 ? "Active" : "Inactive"),
        Box.annotate(i % 2 === 0 ? Ansi.green : Ansi.red)
      );
      return [name, age, city, status];
    });

    const headerRow = Box.hcat(headerBoxes, Box.top);
    const dataRows = rows.map((row) => Box.hcat(row, Box.top));

    return Box.vcat([headerRow, ...dataRows], Box.left);
  };

  bench(
    "Colored table creation",
    () => {
      createColoredTable();
    },
    { time: 1000 }
  );

  bench(
    "Colored table rendering",
    () => {
      const table = createColoredTable();
      Box.renderSync(table, Box.pretty);
    },
    { time: 1000 }
  );

  // Scenario 3: Complex nested layout with alignment
  const createComplexLayout = () => {
    const sidebar = pipe(
      Box.vcat(
        Array.makeBy(5, (i) => Box.text(`Menu ${i + 1}`)),
        Box.left
      ),
      Box.alignVert(Box.top, 30),
      Box.annotate(Ansi.bgBlue)
    );

    const content = pipe(
      Box.text(TestData.large.mixed),
      Box.alignHoriz(Box.center1, 80),
      Box.annotate(Ansi.white)
    );

    const footer = pipe(
      Box.text("Footer text"),
      Box.alignHoriz(Box.center1, 100),
      Box.annotate(Ansi.combine(Ansi.italic, Ansi.dim))
    );

    const main = Box.vcat([content, footer], Box.left);
    return Box.hcat([sidebar, main], Box.top);
  };

  bench(
    "Complex layout creation",
    () => {
      createComplexLayout();
    },
    { time: 1000 }
  );

  bench(
    "Complex layout rendering",
    () => {
      const layout = createComplexLayout();
      Box.renderSync(layout, Box.pretty);
    },
    { time: 1000 }
  );
});
