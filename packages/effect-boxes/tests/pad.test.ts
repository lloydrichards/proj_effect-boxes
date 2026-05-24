import { pipe, String } from "effect";
import { describe, expect, it } from "vitest";
import * as Box from "../src/Box";

/** Replace spaces with dots for visible whitespace in assertions */
const dots = (s: string) => s.replaceAll(" ", ".");

describe("Box.pad", () => {
  // -- pad(all) ---------------------------------------------------------------

  it("pad(1) adds uniform padding on all sides", () => {
    const result = pipe(Box.text("X"), Box.pad(1));
    expect(dots(Box.renderPlainSync(result))).toBe(
      String.stripMargin(
        `|...
         |.X.
         |...`
      )
    );
  });

  it("pad(0) is a no-op", () => {
    const content = Box.text("Hi");
    const result = pipe(content, Box.pad(0));
    expect(Box.renderPlainSync(result)).toBe(Box.renderPlainSync(content));
  });

  // -- pad(vertical, horizontal) ----------------------------------------------

  it("pad(1, 2) adds 1 vertical and 2 horizontal", () => {
    const result = pipe(Box.text("X"), Box.pad(1, 2));
    expect(dots(Box.renderPlainSync(result))).toBe(
      String.stripMargin(
        `|.....
         |..X..
         |.....`
      )
    );
  });

  it("pad(0, 1) adds only horizontal padding", () => {
    const result = pipe(Box.text("X"), Box.pad(0, 1));
    expect(dots(Box.renderPlainSync(result))).toBe(".X.");
  });

  it("pad(1, 0) adds only vertical padding", () => {
    const result = pipe(Box.text("X"), Box.pad(1, 0));
    expect(dots(Box.renderPlainSync(result))).toBe(
      String.stripMargin(
        `|.
         |X
         |.`
      )
    );
  });

  // -- pad(top, right, bottom, left) ------------------------------------------

  it("pad(1, 2, 3, 4) adds asymmetric padding", () => {
    const result = pipe(Box.text("X"), Box.pad(1, 2, 3, 4));
    // width = 4 + 1 + 2 = 7, height = 1 + 1 + 3 = 5
    expect(result.cols).toBe(7);
    expect(result.rows).toBe(5);
  });

  it("pad(0, 0, 0, 3) adds only left padding", () => {
    const result = pipe(Box.text("X"), Box.pad(0, 0, 0, 3));
    expect(dots(Box.renderPlainSync(result))).toBe("...X");
  });

  // -- dimensions -------------------------------------------------------------

  it("dimensions increase by padding amounts", () => {
    const content = Box.text("AB\nCD");
    const result = pipe(content, Box.pad(1, 2));
    expect(result.rows).toBe(content.rows + 2); // +1 top +1 bottom
    expect(result.cols).toBe(content.cols + 4); // +2 left +2 right
  });

  // -- data-first usage -------------------------------------------------------

  it("data-first with pad(all) works", () => {
    const result = Box.pad(Box.text("X"), 1, 1, 1, 1);
    expect(dots(Box.renderPlainSync(result))).toBe(
      String.stripMargin(
        `|...
         |.X.
         |...`
      )
    );
  });

  it("data-first with pad(v, h) works", () => {
    const result = Box.pad(Box.text("X"), 0, 1, 0, 1);
    expect(dots(Box.renderPlainSync(result))).toBe(".X.");
  });

  it("data-first with pad(t, r, b, l) works", () => {
    const result = Box.pad(Box.text("X"), 0, 0, 0, 3);
    expect(dots(Box.renderPlainSync(result))).toBe("...X");
  });

  // -- composition with border ------------------------------------------------

  it("pad inside border adds space between content and border", () => {
    const result = pipe(Box.text("X"), Box.pad(1), Box.border("rounded"));
    expect(Box.renderPlainSync(result)).toBe(
      String.stripMargin(
        `|╭───╮
         |│   │
         |│ X │
         |│   │
         |╰───╯`
      )
    );
  });
});
