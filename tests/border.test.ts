import { Array, pipe, String } from "effect";
import { describe, expect, it } from "vitest";
import * as Box from "../src/Box";

const Border = <A>(self: Box.Box<A>) => {
  const middleBorder = pipe(
    Array.makeBy(self.rows, () => Box.char("│")),
    Box.vcat(Box.left)
  );

  const topBorder = pipe(
    [Box.char("┌"), Box.text("─".repeat(self.cols)), Box.char("┐")],
    Box.hcat(Box.top)
  );

  const bottomBorder = pipe(
    [Box.char("└"), Box.text("─".repeat(self.cols)), Box.char("┘")],
    Box.hcat(Box.top)
  );

  const middleSection = pipe(
    [middleBorder, self, middleBorder],
    Box.hcat(Box.top)
  );

  return pipe([topBorder, middleSection, bottomBorder], Box.vcat(Box.left));
};

describe("Border", () => {
  it("should add a border around the box", () => {
    const box = Box.text("Hello\nWorld");
    const borderedBox = Border(box);
    expect(Box.renderPrettySync(borderedBox)).toBe(
      String.stripMargin(
        `|┌─────┐
         |│Hello│
         |│World│
         |└─────┘`
      )
    );
  });
  it("should handle nested borders", () => {
    const box = Box.text("Hello\nWorld");
    const borderedBox = Border(Border(box));
    expect(Box.renderPrettySync(borderedBox)).toBe(
      String.stripMargin(
        `|┌───────┐
         |│┌─────┐│
         |││Hello││
         |││World││
         |│└─────┘│
         |└───────┘`
      )
    );
  });
  it("should handle emojis in a box", () => {
    const box = Box.text("Hello 👋\nWorld 🌍");
    const borderedBox = Border(box);
    expect(Box.renderPrettySync(borderedBox)).toBe(
      String.stripMargin(
        `|┌────────┐
         |│Hello 👋│
         |│World 🌍│
         |└────────┘`
      )
    );
  });
  it("should handle rows of boxes", () => {
    const box1 = Box.text("Box 1");
    const box2 = Box.text("Box 2");
    const rowBox = pipe([box1, box2], Box.punctuateH(Box.left, Box.text(" ")));
    const borderedBox = Border(rowBox);
    expect(Box.renderPrettySync(borderedBox)).toBe(
      String.stripMargin(
        `|┌───────────┐
         |│Box 1 Box 2│
         |└───────────┘`
      )
    );
  });
  it("should handle rows of boxes", () => {
    const box1 = Box.text("Box 1");
    const box2 = Box.text("Box 🔥");
    const rowBox = pipe([box1, box2], Box.punctuateH(Box.left, Box.text(" ")));
    const borderedBox = Border(rowBox);
    expect(Box.renderPrettySync(borderedBox)).toBe(
      String.stripMargin(
        `|┌────────────┐
         |│Box 1 Box 🔥│
         |└────────────┘`
      )
    );
  });
  it("should handle empty boxes", () => {
    const box = Box.text(" ");
    const borderedBox = Border(box);
    expect(Box.renderPrettySync(borderedBox)).toBe(
      String.stripMargin(
        `|┌─┐
         |│ │
         |└─┘`
      )
    );
  });
});
