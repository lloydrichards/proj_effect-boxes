import { describe, expect, it } from "vitest";
import { pipe, String, Array } from "effect";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";

describe("Ansi Module", () => {
  describe("ANSI Color Definitions", () => {
    it("should define 8 primary colors with correct foreground codes", () => {
      expect(Ansi.black.data.attribute.code).toBe(30);
      expect(Ansi.red.data.attribute.code).toBe(31);
      expect(Ansi.green.data.attribute.code).toBe(32);
      expect(Ansi.yellow.data.attribute.code).toBe(33);
      expect(Ansi.blue.data.attribute.code).toBe(34);
      expect(Ansi.magenta.data.attribute.code).toBe(35);
      expect(Ansi.cyan.data.attribute.code).toBe(36);
      expect(Ansi.white.data.attribute.code).toBe(37);
    });

    it("should define 8 primary colors with correct background codes", () => {
      expect(Ansi.bgBlack.data.attribute.code).toBe(40);
      expect(Ansi.bgRed.data.attribute.code).toBe(41);
      expect(Ansi.bgGreen.data.attribute.code).toBe(42);
      expect(Ansi.bgYellow.data.attribute.code).toBe(43);
      expect(Ansi.bgBlue.data.attribute.code).toBe(44);
      expect(Ansi.bgMagenta.data.attribute.code).toBe(45);
      expect(Ansi.bgCyan.data.attribute.code).toBe(46);
      expect(Ansi.bgWhite.data.attribute.code).toBe(47);
    });
  });

  describe("ANSI Text Attributes", () => {
    it("should define text attribute with correct code", () => {
      expect(Ansi.bold.data.attribute.code).toBe(1);
      expect(Ansi.dim.data.attribute.code).toBe(2);
      expect(Ansi.italic.data.attribute.code).toBe(3);
      expect(Ansi.underlined.data.attribute.code).toBe(4);
      expect(Ansi.blink.data.attribute.code).toBe(5);
      expect(Ansi.inverse.data.attribute.code).toBe(7);
      expect(Ansi.hidden.data.attribute.code).toBe(8);
      expect(Ansi.strikethrough.data.attribute.code).toBe(9);
      expect(Ansi.overline.data.attribute.code).toBe(53);
    });

    it("should define reset attribute with correct code", () => {
      expect(Ansi.reset.data.attribute.name).toBe("reset");
      expect(Ansi.reset.data.attribute.code).toBe(0);
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
});
