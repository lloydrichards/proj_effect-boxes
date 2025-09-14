import { describe, expect, it } from "vitest";
import { pipe, String, Array } from "effect";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";

describe("Ansi Module", () => {
  describe("ANSI Color Definitions", () => {
    it("should define 8 primary colors with correct foreground codes", () => {
      expect(Ansi.black.data.attribute.codes).toEqual([30]);
      expect(Ansi.red.data.attribute.codes).toEqual([31]);
      expect(Ansi.green.data.attribute.codes).toEqual([32]);
      expect(Ansi.yellow.data.attribute.codes).toEqual([33]);
      expect(Ansi.blue.data.attribute.codes).toEqual([34]);
      expect(Ansi.magenta.data.attribute.codes).toEqual([35]);
      expect(Ansi.cyan.data.attribute.codes).toEqual([36]);
      expect(Ansi.white.data.attribute.codes).toEqual([37]);
    });

    it("should define 8 primary colors with correct background codes", () => {
      expect(Ansi.bgBlack.data.attribute.codes).toEqual([40]);
      expect(Ansi.bgRed.data.attribute.codes).toEqual([41]);
      expect(Ansi.bgGreen.data.attribute.codes).toEqual([42]);
      expect(Ansi.bgYellow.data.attribute.codes).toEqual([43]);
      expect(Ansi.bgBlue.data.attribute.codes).toEqual([44]);
      expect(Ansi.bgMagenta.data.attribute.codes).toEqual([45]);
      expect(Ansi.bgCyan.data.attribute.codes).toEqual([46]);
      expect(Ansi.bgWhite.data.attribute.codes).toEqual([47]);
    });
  });

  describe("ANSI Text Attributes", () => {
    it("should define text attribute with correct code", () => {
      expect(Ansi.bold.data.attribute.codes).toEqual([1]);
      expect(Ansi.dim.data.attribute.codes).toEqual([2]);
      expect(Ansi.italic.data.attribute.codes).toEqual([3]);
      expect(Ansi.underlined.data.attribute.codes).toEqual([4]);
      expect(Ansi.blink.data.attribute.codes).toEqual([5]);
      expect(Ansi.inverse.data.attribute.codes).toEqual([7]);
      expect(Ansi.hidden.data.attribute.codes).toEqual([8]);
      expect(Ansi.strikethrough.data.attribute.codes).toEqual([9]);
      expect(Ansi.overline.data.attribute.codes).toEqual([53]);
    });

    it("should define reset attribute with correct code", () => {
      expect(Ansi.reset.data.attribute.name).toEqual("reset");
      expect(Ansi.reset.data.attribute.codes).toEqual([0]);
    });
  });

  describe("Style Combination", () => {
    it("should combine multiple styles without conflicts", () => {
      const combined = Ansi.combine(Ansi.red, Ansi.bgYellow, Ansi.bold);

      expect(combined.data.styles).toHaveLength(3);
      expect(combined.data.escapeSequence).toBe("\x1b[31;43;1m");
    });

    it("should handle conflict resolution with last-wins strategy for foreground colors", () => {
      const combined = Ansi.combine(Ansi.red, Ansi.blue);

      expect(combined.data.styles).toHaveLength(1);
      expect(combined.data.escapeSequence).toBe("\x1b[34m");
    });

    it("should handle conflict resolution with last-wins strategy for background colors", () => {
      const combined = Ansi.combine(Ansi.bgYellow, Ansi.bgGreen);

      expect(combined.data.styles).toHaveLength(1);
      expect(combined.data.escapeSequence).toBe("\x1b[42m");
    });
  });

  describe("Style Combination Arrays", () => {
    it("should accept array input for combine function", () => {
      const combined = Ansi.combine(Ansi.cyan, Ansi.underlined);

      expect(combined.data.styles).toHaveLength(2);
      expect(combined.data.escapeSequence).toBe("\x1b[36;4m");
    });

    it("should support complex example from specification", () => {
      const combined = Ansi.combine(
        Ansi.red,
        Ansi.bgYellow,
        Ansi.bold,
        Ansi.underlined
      );

      expect(combined.data.styles).toHaveLength(4);
      expect(combined.data.escapeSequence).toBe("\x1b[31;43;1;4m");
    });
  });

  describe("Nested Style Handling", () => {
    it("should handle multiple levels of nesting correctly", () => {
      const childBox = Box.text("Red Child").pipe(Box.annotate(Ansi.red));
      const parentBox = Box.hcat(
        [Box.text("Blue Parent ["), childBox, Box.text("]")],
        Box.top
      ).pipe(Box.annotate(Ansi.blue));

      const rendered = Box.render(parentBox, { style: "pretty" });
      const expected = [
        "\u001b[34mBlue Parent [",
        "\u001b[31mRed Child\u001b[0m",
        "\u001b[34m]\u001b[0m",
        "\n",
      ].join("");

      expect(rendered).toBe(expected);
    });

    it("should maintain parent styles in complex box layouts", () => {
      const styledChild = Box.text("Red").pipe(Box.annotate(Ansi.red));
      const layout = Box.hcat(
        [Box.text("A"), styledChild, Box.text("B")],
        Box.top
      ).pipe(Box.annotate(Ansi.blue));

      const rendered = Box.render(layout, { style: "pretty" });
      const expected = [
        "\u001b[34mA",
        "\u001b[31mRed\u001b[0m",
        "\u001b[34mB\u001b[0m",
        "\n",
      ].join("");

      expect(rendered).toBe(expected);
    });
  });

  // ============================================================================
  // Escape Sequence Generation (FR-005)
  // ============================================================================

  describe("Escape Sequence Generation", () => {
    it("should generate correct escape sequence for single foreground color", () => {
      const combined = Ansi.combine(Ansi.red);

      expect(Ansi.toEscapeSequence(combined.data)).toBe("\x1b[31m");
    });

    it("should generate correct escape sequence for background color", () => {
      const combined = Ansi.combine(Ansi.bgYellow);

      expect(Ansi.toEscapeSequence(combined.data)).toBe("\x1b[43m");
    });

    it("should generate correct escape sequence for text attribute", () => {
      const combined = Ansi.combine(Ansi.bold);

      expect(Ansi.toEscapeSequence(combined.data)).toBe("\x1b[1m");
    });
  });

  describe("Box Integration with ANSI Styles", () => {
    it("should apply single color annotation to box rendering with pretty style", () => {
      const styledBox = Box.text("Error message").pipe(Box.annotate(Ansi.red));

      const rendered = Box.render(styledBox, { style: "pretty" });
      expect(rendered).toBe("\u001b[31mError message\u001b[0m\n");
    });

    it("should apply combined styles to box rendering with pretty style", () => {
      const combinedStyle = Ansi.combine(Ansi.red, Ansi.bgYellow, Ansi.bold);
      const styledBox = Box.text("Alert!").pipe(Box.annotate(combinedStyle));

      const rendered = Box.render(styledBox, { style: "pretty" });
      expect(rendered).toBe("\u001b[31;43;1mAlert!\u001b[0m\n");
    });

    it("should preserve existing Box API compatibility", () => {
      const plainBox = Box.text("Plain text");
      const rendered = Box.render(plainBox);

      expect(rendered).toBe("Plain text\n");
      expect(() => Box.render(plainBox)).not.toThrow();
    });

    it("should render without ANSI codes when using plain style", () => {
      const styledBox = Box.text("Plain text").pipe(Box.annotate(Ansi.red));

      const rendered = Box.render(styledBox, { style: "plain" });
      expect(rendered).toBe("Plain text\n");
      expect(rendered).not.toContain("\x1b[");
    });
  });

  describe("Complex Box Layouts with ANSI Styles", () => {
    it("should render layout structure correctly (current implementation)", () => {
      const redBox = Box.text("Red").pipe(Box.annotate(Ansi.red));
      const blueBox = Box.text("Blue").pipe(Box.annotate(Ansi.blue));
      const layout = Box.hcat([redBox, blueBox], Box.top);

      const rendered = Box.render(layout, { style: "pretty" });

      expect(rendered).toContain("\x1b[31mRed\x1b[0m");
      expect(rendered).toContain("\x1b[34mBlue\x1b[0m");
    });

    it("should preserve layout structure with annotations (current implementation)", () => {
      const greenBox = Box.text("Success").pipe(Box.annotate(Ansi.green));
      const yellowBox = Box.text("Warning").pipe(Box.annotate(Ansi.bgYellow));
      const layout = Box.vcat([greenBox as any, yellowBox as any], Box.left);

      const rendered = Box.render(layout, { style: "pretty" });
      expect(rendered).toContain("\x1b[32mSuccess\x1b[0m");
      expect(rendered).toContain("\x1b[43mWarning\x1b[0m");
    });

    it("should handle punctuation with annotations (current implementation)", () => {
      const styledBox = Box.text("BOLD").pipe(Box.annotate(Ansi.bold));
      const plainBox = Box.text("plain");
      const layout = Box.punctuateH(
        [styledBox as any, plainBox as any],
        Box.top,
        Box.text(" | ")
      );

      const rendered = Box.render(layout, { style: "pretty" });
      expect(rendered).toContain("\x1b[1mBOLD\x1b[0m");
    });

    it("should apply ANSI styling to root-level annotated layouts", () => {
      const redBox = Box.text("Red");
      const blueBox = Box.text("Blue");
      const layout = Box.hcat([redBox, blueBox], Box.top);

      const styledLayout = layout.pipe(Box.annotate(Ansi.green));

      const rendered = Box.render(styledLayout, { style: "pretty" });
      expect(rendered).toBe("\u001b[32mRedBlue\u001b[0m\n");
    });
    it("should apply annotaion within a nested box without breaking the layout", () => {
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
        return pipe(
          [topBorder, middleSection, bottomBorder],
          Box.vcat(Box.left)
        );
      };
      const result = Box.hcat(
        [
          Box.text("x").pipe(
            Box.alignHoriz(Box.left, 5),
            Box.annotate(Ansi.red),
            Border
          ),
          Box.text("x\ny").pipe(
            Box.alignHoriz(Box.right, 5),
            Box.annotate(Ansi.blue),
            Border
          ),
        ],
        Box.top
      ).pipe(Box.moveLeft(2), Box.moveRight(2), Border);
      expect(Box.render(result, { style: "pretty" })).toBe(
        String.stripMargin(
          `|┌──────────────────┐
           |│  ┌─────┐┌─────┐  │
           |│  │\u001b[31mx    \u001b[0m││\u001b[34m    x\u001b[0m│  │
           |│  └─────┘│\u001b[34m    y\u001b[0m│  │
           |│         └─────┘  │
           |└──────────────────┘
           |`
        )
      );
    });
  });

  describe("256 and RGB Colors", () => {
    it("should generate correct escape sequence for color256", () => {
      const color = Ansi.color256(100);
      const combined = Ansi.combine(color);
      expect(combined.data.escapeSequence).toBe("\x1b[38;5;100m");
    });

    it("should generate correct escape sequence for bgColor256", () => {
      const color = Ansi.bgColor256(150);
      const combined = Ansi.combine(color);
      expect(combined.data.escapeSequence).toBe("\x1b[48;5;150m");
    });

    it("should generate correct escape sequence for colorRGB", () => {
      const color = Ansi.colorRGB(10, 20, 30);
      const combined = Ansi.combine(color);
      expect(combined.data.escapeSequence).toBe("\x1b[38;2;10;20;30m");
    });

    it("should generate correct escape sequence for bgColorRGB", () => {
      const color = Ansi.bgColorRGB(40, 50, 60);
      const combined = Ansi.combine(color);
      expect(combined.data.escapeSequence).toBe("\x1b[48;2;40;50;60m");
    });

    it("should clamp color values for color256", () => {
      const color = Ansi.color256(300);
      const combined = Ansi.combine(color);
      expect(combined.data.escapeSequence).toBe("\x1b[38;5;45m");
    });

    it("should clamp color values for colorRGB", () => {
      const color = Ansi.colorRGB(300, -10, 255);
      const combined = Ansi.combine(color);
      expect(combined.data.escapeSequence).toBe("\x1b[38;2;45;245;0m");
    });
  });
});
