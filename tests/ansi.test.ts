import { assert, describe, expect, it } from "vitest";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";

describe("Ansi Module", () => {
  describe("ANSI Color Definitions", () => {
    it("should define 8 primary colors with correct foreground codes", () => {
      expect(Ansi.black.data.attribute.code).toBe("30");
      expect(Ansi.red.data.attribute.code).toBe("31");
      expect(Ansi.green.data.attribute.code).toBe("32");
      expect(Ansi.yellow.data.attribute.code).toBe("33");
      expect(Ansi.blue.data.attribute.code).toBe("34");
      expect(Ansi.magenta.data.attribute.code).toBe("35");
      expect(Ansi.cyan.data.attribute.code).toBe("36");
      expect(Ansi.white.data.attribute.code).toBe("37");
    });

    it("should define 8 primary colors with correct background codes", () => {
      expect(Ansi.bgBlack.data.attribute.code).toBe("40");
      expect(Ansi.bgRed.data.attribute.code).toBe("41");
      expect(Ansi.bgGreen.data.attribute.code).toBe("42");
      expect(Ansi.bgYellow.data.attribute.code).toBe("43");
      expect(Ansi.bgBlue.data.attribute.code).toBe("44");
      expect(Ansi.bgMagenta.data.attribute.code).toBe("45");
      expect(Ansi.bgCyan.data.attribute.code).toBe("46");
      expect(Ansi.bgWhite.data.attribute.code).toBe("47");
    });
  });

  describe("ANSI Text Attributes", () => {
    it("should define text attribute with correct code", () => {
      expect(Ansi.bold.data.attribute.code).toBe("1");
      expect(Ansi.dim.data.attribute.code).toBe("2");
      expect(Ansi.italic.data.attribute.code).toBe("3");
      expect(Ansi.underlined.data.attribute.code).toBe("4");
      expect(Ansi.blink.data.attribute.code).toBe("5");
      expect(Ansi.inverse.data.attribute.code).toBe("7");
      expect(Ansi.hidden.data.attribute.code).toBe("8");
      expect(Ansi.strikethrough.data.attribute.code).toBe("9");
      expect(Ansi.overline.data.attribute.code).toBe("53");
    });

    it("should define reset attribute with correct code", () => {
      expect(Ansi.reset.data.attribute.name).toEqual("reset");
      expect(Ansi.reset.data.attribute.code).toBe("0");
    });
  });

  describe("Style Combination", () => {
    it("should combine multiple styles without conflicts", () => {
      const combined = Ansi.combine(Ansi.red, Ansi.bgYellow, Ansi.bold);
      const styles = combined.data;
      expect(styles).toHaveLength(3);
      expect(styles).toContainEqual(Ansi.red.data);
      expect(styles).toContainEqual(Ansi.bgYellow.data);
      expect(styles).toContainEqual(Ansi.bold.data);
    });

    it("should handle conflict resolution with last-wins strategy for foreground colors", () => {
      const combined = Ansi.combine(Ansi.red, Ansi.blue);
      const styles = combined.data;
      assert(Array.isArray(styles));
      expect(styles).toHaveLength(1);
      expect(styles[0]).toEqual(Ansi.blue.data);
    });

    it("should handle conflict resolution with last-wins strategy for background colors", () => {
      const combined = Ansi.combine(Ansi.bgYellow, Ansi.bgGreen);
      const styles = combined.data;
      assert(Array.isArray(styles));
      expect(styles).toHaveLength(1);
      expect(styles[0]).toEqual(Ansi.bgGreen.data);
    });
  });

  describe("Box Integration with ANSI Styles", () => {
    it("should apply single color annotation to box rendering", () => {
      const styledBox = Box.text("Error message").pipe(Box.annotate(Ansi.red));
      const rendered = Ansi.renderAnnotatedBox(styledBox);
      expect(rendered.join("\n")).toBe("\u001b[31mError message\u001b[0m");
    });

    it("should apply combined styles to box rendering", () => {
      const combinedStyle = Ansi.combine(Ansi.red, Ansi.bgYellow, Ansi.bold);
      const styledBox = Box.text("Alert!").pipe(Box.annotate(combinedStyle));
      const rendered = Ansi.renderAnnotatedBox(styledBox);
      expect(rendered.join("\n")).toBe("\u001b[31;43;1mAlert!\u001b[0m");
    });
  });

  describe("Complex Box Layouts with ANSI Styles", () => {
    it("should render layout structure correctly", () => {
      const redBox = Box.text("Red").pipe(Box.annotate(Ansi.red));
      const blueBox = Box.text("Blue").pipe(Box.annotate(Ansi.blue));
      const layout = Box.hcat([redBox, blueBox], Box.top);
      const rendered = Ansi.renderAnnotatedBox(layout);
      expect(rendered.join("")).toContain("\u001b[31mRed\u001b[0m");
      expect(rendered.join("")).toContain("\u001b[34mBlue\u001b[0m");
    });

    it("should apply ANSI styling to root-level annotated layouts", () => {
      const redBox = Box.text("Red");
      const blueBox = Box.text("Blue");
      const layout = Box.hcat([redBox, blueBox], Box.top);
      const styledLayout = layout.pipe(Box.annotate(Ansi.green));
      const rendered = Ansi.renderAnnotatedBox(styledLayout);
      expect(rendered.join("\n")).toBe("\u001b[32mRedBlue\u001b[0m");
    });
  });

  describe("256 and RGB Colors", () => {
    it("should generate correct escape sequence for color256", () => {
      const color = Ansi.color256(100);
      const styledBox = Box.text("test").pipe(Box.annotate(color));
      const rendered = Ansi.renderAnnotatedBox(styledBox);
      expect(rendered.join("")).toContain("\u001b[38;5;100m");
    });

    it("should generate correct escape sequence for bgColor256", () => {
      const color = Ansi.bgColor256(150);
      const styledBox = Box.text("test").pipe(Box.annotate(color));
      const rendered = Ansi.renderAnnotatedBox(styledBox);
      expect(rendered.join("")).toContain("\u001b[48;5;150m");
    });

    it("should generate correct escape sequence for colorRGB", () => {
      const color = Ansi.colorRGB(10, 20, 30);
      const styledBox = Box.text("test").pipe(Box.annotate(color));
      const rendered = Ansi.renderAnnotatedBox(styledBox);
      expect(rendered.join("")).toContain("\u001b[38;2;10;20;30m");
    });

    it("should generate correct escape sequence for bgColorRGB", () => {
      const color = Ansi.bgColorRGB(40, 50, 60);
      const styledBox = Box.text("test").pipe(Box.annotate(color));
      const rendered = Ansi.renderAnnotatedBox(styledBox);
      expect(rendered.join("")).toContain("\u001b[48;2;40;50;60m");
    });

    it("should clamp color values for color256", () => {
      const color = Ansi.color256(300);
      const styledBox = Box.text("test").pipe(Box.annotate(color));
      const rendered = Ansi.renderAnnotatedBox(styledBox);
      expect(rendered.join("")).toContain("\u001b[38;5;255m");
    });

    it("should clamp color values for colorRGB", () => {
      const color = Ansi.colorRGB(300, -10, 255);
      const styledBox = Box.text("test").pipe(Box.annotate(color));
      const rendered = Ansi.renderAnnotatedBox(styledBox);
      expect(rendered.join("")).toContain("\u001b[38;2;255;0;255m");
    });
  });
});
