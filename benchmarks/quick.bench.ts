/** biome-ignore-all lint/suspicious/noConsole: testing file*/

import { Array } from "effect";
import { bench, describe } from "vitest";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";
import * as Width from "../src/internal/width";

// Quick test data
const testData = {
  ascii: "Hello world test string with some content",
  unicode: "你好世界 こんにちは 안녕하세요 🌍🚀✨",
  ansi: "\x1b[31mRed\x1b[0m \x1b[32mGreen\x1b[0m \x1b[34mBlue\x1b[0m text",
  medium: Array.makeBy(1000, () => "x").join(""),
};

const quickBoxes = Array.makeBy(10, (i) => Box.text(`Box ${i}\nContent line`));

describe("Quick Performance Benchmarks", () => {
  bench(
    "Width.ofString - mixed content",
    () => {
      Width.ofString(testData.unicode);
    },
    { time: 500 }
  );

  bench(
    "Box.hcat - medium array",
    () => {
      Box.hcat(quickBoxes, Box.top);
    },
    { time: 500 }
  );

  bench(
    "ANSI truncate - colored text",
    () => {
      Ansi.truncatePreservingAnsi(testData.ansi, 20);
    },
    { time: 500 }
  );

  bench(
    "Box render - complex structure",
    () => {
      const nested = Box.vcat(
        [
          Box.hcat(quickBoxes.slice(0, 5), Box.top),
          Box.hcat(quickBoxes.slice(5, 10), Box.top),
        ],
        Box.left
      );
      Box.renderPrettySync(nested);
    },
    { time: 500 }
  );

  bench(
    "ANSI annotation - end-to-end",
    () => {
      const annotated = Box.annotate(
        Box.text(testData.ascii),
        Ansi.combine(Ansi.bold, Ansi.red)
      );
      Ansi.renderAnnotatedBox(annotated);
    },
    { time: 500 }
  );
});
