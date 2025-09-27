import { describe, expect, it } from "vitest";
import * as Width from "../src/internal/width";

describe("Width.of()", () => {
  describe("ASCII and Basic Latin", () => {
    it("should handle simple ASCII strings", () => {
      expect(Width.ofString("abc")).toBe(3);
      expect(Width.ofString("Hello, world!")).toBe(13);
    });

    it("should handle an empty string", () => {
      expect(Width.ofString("")).toBe(0);
    });

    it("should handle single characters", () => {
      expect(Width.ofString("a")).toBe(1);
      expect(Width.ofString(" ")).toBe(1);
    });
  });

  describe("ANSI Escape Codes", () => {
    it("should strip simple color codes", () => {
      expect(Width.ofString("\u001b[31mred\u001b[0m")).toBe(3);
      expect(Width.ofString("\u001b[32mgreen\u001b[39m")).toBe(5);
    });

    it("should strip complex and multiple codes", () => {
      const text = "\u001b[1;31mbold red\u001b[0m";
      expect(Width.ofString(text)).toBe(8);
    });

    it("should handle codes with no text", () => {
      expect(Width.ofString("\u001b[31m\u001b[0m")).toBe(0);
    });

    it("should handle text with only ANSI codes", () => {
      expect(Width.ofString("\u001b[31m\u001b[4m\u001b[1m")).toBe(0);
    });

    it("should not strip parts of OSC sequences", () => {
      const text = "\u001b]8;;http://example.com\u0007link\u001b]8;;\u0007";
      expect(Width.ofString(text)).toBe(4);
    });
  });

  describe("Unicode and Combining Marks", () => {
    it("should treat combining marks as zero-width", () => {
      expect(Width.ofString("a\u0300")).toBe(1); // à
      expect(Width.ofString("e\u0301")).toBe(1); // é
      expect(Width.ofString("o\u0308\u0332")).toBe(1); // ö̲
    });

    it("should handle sequences of combining marks", () => {
      expect(Width.ofString("Z\u030d\u035e\u0336\u031a")).toBe(1);
    });

    it("should handle pre-composed vs decomposed characters", () => {
      expect(Width.ofString("é")).toBe(1); // Pre-composed
      expect(Width.ofString("e\u0301")).toBe(1); // Decomposed
    });

    it("should handle mixed ASCII and combining marks", () => {
      expect(Width.ofString("a̐éö̲")).toBe(3);
      expect(Width.ofString("Z͑a̐éö̲")).toBe(4);
    });
  });

  describe("East Asian and Wide Characters", () => {
    it("should calculate width for CJK characters", () => {
      expect(Width.ofString("你好")).toBe(4); // Chinese
      expect(Width.ofString("こんにちは")).toBe(10); // Japanese
      expect(Width.ofString("안녕하세요")).toBe(10); // Korean
    });

    it("should handle full-width ASCII", () => {
      expect(Width.ofString("ＡＢＣ")).toBe(6);
    });

    it("should handle mixed wide and narrow characters", () => {
      expect(Width.ofString("hello你好")).toBe(9);
      expect(Width.ofString("（test）")).toBe(8);
    });

    it("should handle other wide characters", () => {
      expect(Width.ofString("【】")).toBe(4);
      expect(Width.ofString("『』")).toBe(4);
    });
  });

  describe("Emoji Sequences", () => {
    it("should handle simple emojis", () => {
      expect(Width.ofString("😀")).toBe(2);
      expect(Width.ofString("❤️")).toBe(2);
    });

    it("should handle emojis with variation selectors", () => {
      expect(Width.ofString("💙")).toBe(2); // Heart emoji with explicit emoji presentation
    });

    it("should handle complex ZWJ (Zero Width Joiner) sequences", () => {
      expect(Width.ofString("👩‍💻")).toBe(2); // Woman Technologist
      expect(Width.ofString("👨‍👩‍👧‍👦")).toBe(2); // Family: Man, Woman, Girl, Boy
      expect(Width.ofString("🏳️‍🌈")).toBe(2); // Rainbow Flag
    });

    it("should handle emojis with skin tone modifiers", () => {
      expect(Width.ofString("👍")).toBe(2);
      expect(Width.ofString("👍🏻")).toBe(2);
      expect(Width.ofString("👍🏿")).toBe(2);
    });

    it("should handle mixed text and emojis", () => {
      expect(Width.ofString("hello 👋 world")).toBe(14);
    });
  });

  describe("Zero-Width and Control Characters", () => {
    it("should handle zero-width spaces", () => {
      expect(Width.ofString("a\u200Bb")).toBe(2);
    });

    it("should handle control characters", () => {
      expect(Width.ofString("a\u0007b")).toBe(2); // BELL character
      expect(Width.ofString("a\nb")).toBe(2);
    });
  });

  describe("Mixed and Edge Cases", () => {
    it("should handle a complex mix of everything", () => {
      const complex = "\u001b[31m你好\u001b[0m world 👋 a\u0300 and 🏳️‍🌈";
      expect(Width.ofString(complex)).toBe(22); // 你好(4) + " "(1) + world(5) + " "(1) + 👋(2) + " "(1) + à(1) + " "(1) + and(3) + " "(1) + 🏳️‍🌈(2)
    });

    it("should handle strings with only non-printable characters", () => {
      expect(Width.ofString("\u200B\u0301\u001b[31m")).toBe(0);
    });
  });
});
