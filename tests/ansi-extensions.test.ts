import { describe, it, expect } from "vitest";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";

describe("Ansi extensions", () => {
  describe("bright & default constants", () => {
    it("should expose bright foreground codes", () => {
      expect(Ansi.redBright.data.attribute.code).toBe(91);
      expect(Ansi.cyanBright.data.attribute.code).toBe(96);
    });
    it("should expose bright background codes", () => {
      expect(Ansi.bgBlueBright.data.attribute.code).toBe(104);
      expect(Ansi.bgWhiteBright.data.attribute.code).toBe(107);
    });
    it("should expose default color resets", () => {
      // foreground default
      expect(Ansi.default.data.attribute.code).toBe(39);
      // background default
      expect(Ansi.bgDefault.data.attribute.code).toBe(49);
    });
  });

  describe("256-color & RGB builders (wrapping)", () => {
    it("color256 wraps index via modulo 256", () => {
      const a = Ansi.color256(260);
      // 260 % 256 = 4 -> SGR: 38;5;4
      const combined = Ansi.combine(a);
      expect(combined.data.escapeSequence).toBe("\x1b[38;5;4m");
    });

    it("bgColor256 wraps index via modulo 256", () => {
      const a = Ansi.bgColor256(-1); // => 255
      const combined = Ansi.combine(a);
      expect(combined.data.escapeSequence).toBe("\x1b[48;5;255m");
    });

    it("rgb wraps channels via modulo 256", () => {
      const a = Ansi.rgb(300, -2, 256); // => 44, 254, 0
      const combined = Ansi.combine(a);
      expect(combined.data.escapeSequence).toBe("\x1b[38;2;44;254;0m");
    });

    it("bgRgb wraps channels via modulo 256", () => {
      const a = Ansi.bgRgb(-1, 512, 95); // => 255, 0, 95
      const combined = Ansi.combine(a);
      expect(combined.data.escapeSequence).toBe("\x1b[48;2;255;0;95m");
    });
  });

  describe("conflict resolution across FG/BG variants", () => {
    it("last-wins for FG across simple -> 256 -> RGB", () => {
      const combined = Ansi.combine(Ansi.red, Ansi.color256(5), Ansi.rgb(1, 2, 3));
      expect(combined.data.escapeSequence).toBe("\x1b[38;2;1;2;3m");
    });
    it("last-wins for BG across 256 -> simple", () => {
      const combined = Ansi.combine(Ansi.bgColor256(10), Ansi.bgBlue);
      expect(combined.data.escapeSequence).toBe("\x1b[44m");
    });
  });

  describe("attributes coexist", () => {
    it("combines attributes with colors", () => {
      const combined = Ansi.combine(Ansi.italic, Ansi.strikethrough, Ansi.redBright);
      expect(combined.data.escapeSequence).toBe("\x1b[3;9;91m");
    });
  });

  describe("Box rendering integration", () => {
    it("renders pretty with 256-color FG", () => {
      const b = Box.text("x").pipe(Box.annotate(Ansi.color256(196)));
      const rendered = Box.render(b, { style: "pretty" });
      expect(rendered).toBe("\x1b[38;5;196mx\x1b[0m\n");
    });

    it("renders pretty with RGB BG + bold", () => {
      const style = Ansi.combine(Ansi.bgRgb(10, 20, 30), Ansi.bold);
      const b = Box.text("x").pipe(Box.annotate(style));
      const rendered = Box.render(b, { style: "pretty" });
      expect(rendered).toBe("\x1b[48;2;10;20;30;1mx\x1b[0m\n");
    });

    it("renders plain without SGR", () => {
      const b = Box.text("x").pipe(Box.annotate(Ansi.rgb(1, 2, 3)));
      const rendered = Box.render(b, { style: "plain" });
      expect(rendered).toBe("x\n");
    });
  });
});
