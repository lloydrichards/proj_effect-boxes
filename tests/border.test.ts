import { pipe, String } from "effect";
import { describe, expect, it } from "vitest";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";

describe("Box.border", () => {
  it("wraps a single-line text with default (single) border", () => {
    const result = pipe(Box.text("Hi"), Box.border());
    expect(Box.renderPlainSync(result)).toBe(
      String.stripMargin(
        `|┌──┐
         |│Hi│
         |└──┘`
      )
    );
  });

  it("wraps multi-line text", () => {
    const result = pipe(Box.text("AB\nCD"), Box.border());
    expect(Box.renderPlainSync(result)).toBe(
      String.stripMargin(
        `|┌──┐
         |│AB│
         |│CD│
         |└──┘`
      )
    );
  });

  it("supports rounded style", () => {
    const result = pipe(Box.text("X"), Box.border("rounded"));
    expect(Box.renderPlainSync(result)).toBe(
      String.stripMargin(
        `|╭─╮
         |│X│
         |╰─╯`
      )
    );
  });

  it("supports double style", () => {
    const result = pipe(Box.text("X"), Box.border("double"));
    expect(Box.renderPlainSync(result)).toBe(
      String.stripMargin(
        `|╔═╗
         |║X║
         |╚═╝`
      )
    );
  });

  it("supports thick style", () => {
    const result = pipe(Box.text("X"), Box.border("thick"));
    expect(Box.renderPlainSync(result)).toBe(
      String.stripMargin(
        `|┏━┓
         |┃X┃
         |┗━┛`
      )
    );
  });

  it("supports ascii style", () => {
    const result = pipe(Box.text("X"), Box.border("ascii"));
    expect(Box.renderPlainSync(result)).toBe(
      String.stripMargin(
        `|+-+
         ||X|
         |+-+`
      )
    );
  });

  it("data-first usage works", () => {
    const result = Box.border(Box.text("Hi"), "single", {});
    expect(Box.renderPlainSync(result)).toBe(
      String.stripMargin(
        `|┌──┐
         |│Hi│
         |└──┘`
      )
    );
  });

  it("dimensions are correct (content + 2 for border)", () => {
    const content = Box.text("Hello");
    const bordered = pipe(content, Box.border());
    expect(bordered.rows).toBe(content.rows + 2);
    expect(bordered.cols).toBe(content.cols + 2);
  });

  it("works with annotation for border color", () => {
    const result = pipe(
      Box.text("Hi"),
      Box.border("rounded", { annotation: Ansi.red })
    );
    expect(result.rows).toBe(3);
    expect(result.cols).toBe(4);
  });

  it("handles empty box", () => {
    const result = pipe(Box.emptyBox(0, 0), Box.border());
    expect(result.cols).toBe(2);
  });
});
