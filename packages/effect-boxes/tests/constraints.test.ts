import { pipe } from "effect";
import { describe, expect, it } from "vitest";
import * as Box from "../src/Box";

/** Replace spaces with dots for visible whitespace in assertions */
const dots = (s: string) => s.replaceAll(" ", ".");

describe("Box.minWidth", () => {
  it("pads a narrow box to the target width", () => {
    const result = pipe(Box.text("Hi"), Box.minWidth(10));
    expect(Box.cols(result)).toBe(10);
    expect(Box.rows(result)).toBe(1);
  });

  it("is a no-op when box is already wider", () => {
    const result = pipe(Box.text("Hello World"), Box.minWidth(5));
    expect(Box.cols(result)).toBe(11);
  });

  it("is a no-op when box equals target width", () => {
    const result = pipe(Box.text("ABC"), Box.minWidth(3));
    expect(Box.cols(result)).toBe(3);
  });

  it("pads with spaces on the right (left-aligned)", () => {
    const result = pipe(Box.text("Hi"), Box.minWidth(5));
    expect(dots(Box.renderPlainSync(result))).toBe("Hi...");
  });

  it("works with multi-line boxes", () => {
    const result = pipe(Box.text("A\nBC"), Box.minWidth(5));
    expect(Box.cols(result)).toBe(5);
    expect(Box.rows(result)).toBe(2);
  });

  it("supports data-first usage", () => {
    const result = Box.minWidth(Box.text("Hi"), 10);
    expect(Box.cols(result)).toBe(10);
  });
});

describe("Box.maxWidth", () => {
  it("truncates a wide box to the target width", () => {
    const result = pipe(Box.text("Hello World"), Box.maxWidth(5));
    expect(Box.cols(result)).toBe(5);
  });

  it("is a no-op when box is already narrower", () => {
    const result = pipe(Box.text("Hi"), Box.maxWidth(10));
    expect(Box.cols(result)).toBe(2);
  });

  it("is a no-op when box equals target width", () => {
    const result = pipe(Box.text("ABC"), Box.maxWidth(3));
    expect(Box.cols(result)).toBe(3);
  });

  it("truncates content correctly", () => {
    const result = pipe(Box.text("Hello World"), Box.maxWidth(5));
    expect(Box.renderPlainSync(result)).toBe("Hello");
  });

  it("truncates each line of a multi-line box", () => {
    const result = pipe(Box.text("Hello\nWorld!"), Box.maxWidth(3));
    expect(Box.renderPlainSync(result)).toBe("Hel\nWor");
  });

  it("supports data-first usage", () => {
    const result = Box.maxWidth(Box.text("Hello World"), 5);
    expect(Box.cols(result)).toBe(5);
  });
});

describe("Box.minHeight", () => {
  it("pads a short box to the target height", () => {
    const result = pipe(Box.text("X"), Box.minHeight(5));
    expect(Box.rows(result)).toBe(5);
    expect(Box.cols(result)).toBe(1);
  });

  it("is a no-op when box is already taller", () => {
    const result = pipe(Box.text("A\nB\nC\nD\nE"), Box.minHeight(3));
    expect(Box.rows(result)).toBe(5);
  });

  it("is a no-op when box equals target height", () => {
    const result = pipe(Box.text("A\nB"), Box.minHeight(2));
    expect(Box.rows(result)).toBe(2);
  });

  it("pads with blank rows at the bottom (top-aligned)", () => {
    const result = pipe(Box.text("X"), Box.minHeight(3));
    expect(dots(Box.renderPlainSync(result))).toBe("X\n.\n.");
  });

  it("supports data-first usage", () => {
    const result = Box.minHeight(Box.text("X"), 5);
    expect(Box.rows(result)).toBe(5);
  });
});

describe("Box.maxHeight", () => {
  it("truncates a tall box to the target height", () => {
    const result = pipe(Box.text("A\nB\nC\nD\nE"), Box.maxHeight(3));
    expect(Box.rows(result)).toBe(3);
  });

  it("is a no-op when box is already shorter", () => {
    const result = pipe(Box.text("A\nB"), Box.maxHeight(5));
    expect(Box.rows(result)).toBe(2);
  });

  it("is a no-op when box equals target height", () => {
    const result = pipe(Box.text("A\nB\nC"), Box.maxHeight(3));
    expect(Box.rows(result)).toBe(3);
  });

  it("keeps only the first n rows", () => {
    const result = pipe(Box.text("A\nB\nC\nD\nE"), Box.maxHeight(3));
    expect(Box.renderPlainSync(result)).toBe("A\nB\nC");
  });

  it("supports data-first usage", () => {
    const result = Box.maxHeight(Box.text("A\nB\nC\nD\nE"), 2);
    expect(Box.rows(result)).toBe(2);
  });
});

describe("constraints composition", () => {
  it("minWidth + maxWidth clamps to exact width", () => {
    const result = pipe(Box.text("Hi"), Box.minWidth(10), Box.maxWidth(10));
    expect(Box.cols(result)).toBe(10);
  });

  it("minHeight + maxHeight clamps to exact height", () => {
    const result = pipe(Box.text("X"), Box.minHeight(5), Box.maxHeight(5));
    expect(Box.rows(result)).toBe(5);
  });

  it("all four constraints can be composed", () => {
    const result = pipe(
      Box.text("Hi"),
      Box.minWidth(10),
      Box.maxWidth(20),
      Box.minHeight(3),
      Box.maxHeight(5)
    );
    expect(Box.cols(result)).toBe(10);
    expect(Box.rows(result)).toBe(3);
  });
});
