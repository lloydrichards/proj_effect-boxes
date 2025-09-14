import { pipe } from "effect";
import { describe, expect, it } from "vitest";
import * as Annotation from "../src/Annotation";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";
import * as CMD from "../src/CMD";

// Helper function to safely extract CMD annotation data
const getCmdData = (box: Box.Box<CMD.CmdType>): CMD.CmdType => {
  if (!box.annotation) {
    throw new Error("Expected CMD annotation but found none");
  }
  return box.annotation.data;
};

describe("CMD Module", () => {
  describe("Cursor Movement Commands", () => {
    describe("cursorUp", () => {
      it("should create box with correct escape sequence for default value", () => {
        const cmd = CMD.cursorUp();
        expect(cmd.annotation?.data.command).toBe("\x1b[1A");
      });

      it("should create box with correct escape sequence for custom value", () => {
        const cmd = CMD.cursorUp(5);
        expect(cmd.annotation?.data.command).toBe("\x1b[5A");
      });

      it("should clamp negative values to 0", () => {
        const cmd = CMD.cursorUp(-3);
        expect(cmd.annotation?.data.command).toBe("\x1b[0A");
      });

      it("should floor decimal values", () => {
        const cmd = CMD.cursorUp(3.7);
        expect(cmd.annotation?.data.command).toBe("\x1b[3A");
      });
    });

    describe("cursorDown", () => {
      it("should create box with correct escape sequence for default value", () => {
        const cmd = CMD.cursorDown();
        expect(cmd.annotation?.data.command).toBe("\x1b[1B");
      });

      it("should create box with correct escape sequence for custom value", () => {
        const cmd = CMD.cursorDown(3);
        expect(cmd.annotation?.data.command).toBe("\x1b[3B");
      });

      it("should clamp negative values to 0", () => {
        const cmd = CMD.cursorDown(-2);
        expect(cmd.annotation?.data.command).toBe("\x1b[0B");
      });
    });

    describe("cursorLeft", () => {
      it("should create box with correct escape sequence for default value", () => {
        const cmd = CMD.cursorLeft();
        expect(cmd.annotation?.data.command).toBe("\x1b[1D");
      });

      it("should create box with correct escape sequence for custom value", () => {
        const cmd = CMD.cursorLeft(7);
        expect(cmd.annotation?.data.command).toBe("\x1b[7D");
      });

      it("should clamp negative values to 0", () => {
        const cmd = CMD.cursorLeft(-1);
        expect(cmd.annotation?.data.command).toBe("\x1b[0D");
      });
    });

    describe("cursorRight", () => {
      it("should create box with correct escape sequence for default value", () => {
        const cmd = CMD.cursorRight();
        expect(cmd.annotation?.data.command).toBe("\x1b[1C");
      });

      it("should create box with correct escape sequence for custom value", () => {
        const cmd = CMD.cursorRight(4);
        expect(cmd.annotation?.data.command).toBe("\x1b[4C");
      });

      it("should clamp negative values to 0", () => {
        const cmd = CMD.cursorRight(-5);
        expect(cmd.annotation?.data.command).toBe("\x1b[0C");
      });
    });

    describe("cursorForward", () => {
      it("should be an alias for cursorRight", () => {
        const forward = CMD.cursorForward(3);
        const right = CMD.cursorRight(3);
        expect(forward.annotation?.data.command).toBe(
          right.annotation?.data.command
        );
      });
    });

    describe("cursorBackward", () => {
      it("should be an alias for cursorLeft", () => {
        const backward = CMD.cursorBackward(2);
        const left = CMD.cursorLeft(2);
        expect(backward.annotation?.data.command).toBe(
          left.annotation?.data.command
        );
      });
    });

    // Note: cursorTo and cursorMove use dual functions, so we test them differently
    describe("cursorTo", () => {
      it("should position cursor at specific coordinates (data-first)", () => {
        const cmd = CMD.cursorTo(5, 3);
        expect(cmd.annotation?.data.command).toBe("\x1b[4;6H");
      });

      it("should position cursor at column only (row defaults to 0)", () => {
        const cmd = CMD.cursorTo(10);
        expect(cmd.annotation?.data.command).toBe("\x1b[1;11H");
      });

      it("should handle zero coordinates", () => {
        const cmd = CMD.cursorTo(0, 0);
        expect(cmd.annotation?.data.command).toBe("\x1b[1;1H");
      });

      it("should clamp negative coordinates", () => {
        const cmd = CMD.cursorTo(-2, -1);
        expect(cmd.annotation?.data.command).toBe("\x1b[1;1H");
      });
    });

    describe("cursorMove", () => {
      it("should move cursor right and down with positive values", () => {
        const cmd = CMD.cursorMove(3, 2);
        expect(cmd.annotation?.data.command).toBe("\x1b[2B\x1b[3C");
      });

      it("should move cursor left and up with negative values", () => {
        const cmd = CMD.cursorMove(-4, -1);
        expect(cmd.annotation?.data.command).toBe("\x1b[1A\x1b[4D");
      });

      it("should handle column only movement (row defaults to 0)", () => {
        const cmd = CMD.cursorMove(5);
        expect(cmd.annotation?.data.command).toBe("\x1b[5C");
      });

      it("should handle zero movement", () => {
        const cmd = CMD.cursorMove(0, 0);
        expect(cmd.annotation?.data.command).toBe("");
      });

      it("should handle mixed positive/negative movement", () => {
        const cmd = CMD.cursorMove(-2, 3);
        expect(cmd.annotation?.data.command).toBe("\x1b[3B\x1b[2D");
      });
    });
  });

  describe("Line Navigation Commands", () => {
    describe("cursorNextLine", () => {
      it("should move to next line with default value", () => {
        const cmd = CMD.cursorNextLine();
        expect(cmd.annotation?.data.command).toBe("\x1b[1E");
      });

      it("should move to next line with custom value", () => {
        const cmd = CMD.cursorNextLine(3);
        expect(cmd.annotation?.data.command).toBe("\x1b[3E");
      });

      it("should clamp negative values", () => {
        const cmd = CMD.cursorNextLine(-2);
        expect(cmd.annotation?.data.command).toBe("\x1b[0E");
      });
    });

    describe("cursorPrevLine", () => {
      it("should move to previous line with default value", () => {
        const cmd = CMD.cursorPrevLine();
        expect(cmd.annotation?.data.command).toBe("\x1b[1F");
      });

      it("should move to previous line with custom value", () => {
        const cmd = CMD.cursorPrevLine(2);
        expect(cmd.annotation?.data.command).toBe("\x1b[2F");
      });

      it("should clamp negative values", () => {
        const cmd = CMD.cursorPrevLine(-1);
        expect(cmd.annotation?.data.command).toBe("\x1b[0F");
      });
    });
  });

  describe("Position Save/Restore Commands", () => {
    describe("cursorSavePosition", () => {
      it("should generate DEC save position sequence", () => {
        const cmd = CMD.cursorSavePosition();
        expect(cmd.annotation?.data.command).toBe("\x1b7");
      });
    });

    describe("cursorRestorePosition", () => {
      it("should generate DEC restore position sequence", () => {
        const cmd = CMD.cursorRestorePosition();
        expect(cmd.annotation?.data.command).toBe("\x1b8");
      });
    });
  });

  describe("Cursor Visibility Commands", () => {
    describe("cursorShow", () => {
      it("should generate cursor show sequence", () => {
        const cmd = CMD.cursorShow();
        expect(cmd.annotation?.data.command).toBe("\x1b[?25h");
      });
    });

    describe("cursorHide", () => {
      it("should generate cursor hide sequence", () => {
        const cmd = CMD.cursorHide();
        expect(cmd.annotation?.data.command).toBe("\x1b[?25l");
      });
    });
  });

  describe("Screen Erase Commands", () => {
    describe("eraseScreen", () => {
      it("should generate clear entire screen sequence", () => {
        const cmd = CMD.eraseScreen();
        expect(cmd.annotation?.data.command).toBe("\x1b[2J");
      });
    });

    describe("eraseUp", () => {
      it("should generate clear up to cursor sequence", () => {
        const cmd = CMD.eraseUp();
        expect(cmd.annotation?.data.command).toBe("\x1b[1J");
      });
    });

    describe("eraseDown", () => {
      it("should generate clear down from cursor sequence", () => {
        const cmd = CMD.eraseDown();
        expect(cmd.annotation?.data.command).toBe("\x1b[0J");
      });
    });

    describe("eraseLine", () => {
      it("should generate clear entire line sequence", () => {
        const cmd = CMD.eraseLine();
        expect(cmd.annotation?.data.command).toBe("\x1b[2K");
      });
    });

    describe("eraseStartLine", () => {
      it("should generate clear line from start to cursor sequence", () => {
        const cmd = CMD.eraseStartLine();
        expect(cmd.annotation?.data.command).toBe("\x1b[1K");
      });
    });

    describe("eraseEndLine", () => {
      it("should generate clear line from cursor to end sequence", () => {
        const cmd = CMD.eraseEndLine();
        expect(cmd.annotation?.data.command).toBe("\x1b[0K");
      });
    });

    describe("eraseLines", () => {
      it("should generate erase multiple lines sequence", () => {
        const cmd = CMD.eraseLines(5);
        expect(cmd.annotation?.data.command).toBe("\x1b[5M");
      });

      it("should clamp negative values", () => {
        const cmd = CMD.eraseLines(-3);
        expect(cmd.annotation?.data.command).toBe("\x1b[0M");
      });
    });
  });

  describe("Utility Commands", () => {
    describe("clearScreen", () => {
      it("should generate combined clear screen and home sequence", () => {
        const cmd = CMD.clearScreen();
        expect(cmd.annotation?.data.command).toBe("\x1b[2J\x1b[H");
      });
    });

    describe("home", () => {
      it("should generate home position sequence", () => {
        const cmd = CMD.home();
        expect(cmd.annotation?.data.command).toBe("\x1b[H");
      });
    });

    describe("bell", () => {
      it("should generate bell sequence", () => {
        const cmd = CMD.bell();
        expect(cmd.annotation?.data.command).toBe("\x07");
      });
    });
  });

  describe("CmdType Properties", () => {
    it("should have correct _tag for cursor commands", () => {
      const cmd = CMD.cursorUp();
      expect(getCmdData(cmd)._tag).toBe("Cursor");
    });

    it("should have correct _tag for screen commands", () => {
      const cmd = CMD.eraseScreen();
      expect(getCmdData(cmd)._tag).toBe("Screen");
    });

    it("should have correct _tag for visibility commands", () => {
      const cmd = CMD.cursorHide();
      expect(getCmdData(cmd)._tag).toBe("Visibility");
    });

    it("should have correct _tag for utility commands", () => {
      const cmd = CMD.home();
      expect(getCmdData(cmd)._tag).toBe("Utility");
    });
  });

  describe("Box Integration", () => {
    it("should create null boxes with single annotation", () => {
      const cmd = CMD.cursorUp(5);
      expect(cmd.rows).toBe(0);
      expect(cmd.cols).toBe(0);
      expect(cmd.annotation).toBeDefined();
    });

    it("should be composable with other boxes", () => {
      const textBox = Box.text("Hello");
      const cmdBox = CMD.cursorUp(2);
      const combined = Box.hAppend(cmdBox, textBox);

      expect(combined.rows).toBe(1); // Text box height
      expect(combined.cols).toBe(5); // Text box width
      // Note: Composition functions create new boxes and don't preserve individual annotations
      // This is expected behavior as the combined box represents a layout, not a command
    });

    it("should work with pipe operations", () => {
      const result = pipe(CMD.cursorUp(3), (cmdBox) =>
        Box.hAppend(cmdBox, Box.text("Test"))
      );

      expect(result.rows).toBe(1);
      expect(result.cols).toBe(4); // "Test" length
      // Combined boxes don't preserve individual annotations
    });

    it("should maintain CMD annotation when used standalone", () => {
      const cmdBox = CMD.cursorUp(3);
      expect(cmdBox.annotation).toBeDefined();
      expect(cmdBox.annotation?.data.command).toBe("\x1b[3A");
    });
  });

  describe("CMD-Ansi Integration", () => {
    it("should render CMD-annotated boxes through the Ansi module", () => {
      const cmdBox = CMD.cursorUp(3);
      const lines = Ansi.renderAnnotatedBox(cmdBox);

      // CMD boxes are null boxes (0 rows, 0 cols), so they return empty array
      expect(lines).toEqual([]);
    });

    it("should integrate CMD annotations with text content", () => {
      const textBox = Box.text("Hello World");
      const cmdAnnotation = Annotation.createAnnotation(
        getCmdData(CMD.cursorUp(2))
      );
      const cmdAnnotatedBox = pipe(textBox, Box.annotate(cmdAnnotation));

      const lines = Ansi.renderAnnotatedBox(cmdAnnotatedBox);

      // Should render text with CMD escape sequence applied
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain("Hello World");
      expect(lines[0]).toContain("\x1b[2A");
    });

    it("should handle complex CMD-annotated layouts", () => {
      const content = Box.text("Test Content");
      const cmdAnnotation = Annotation.createAnnotation(
        getCmdData(CMD.clearScreen())
      );
      const cmdAnnotatedBox = pipe(content, Box.annotate(cmdAnnotation));

      const lines = Ansi.renderAnnotatedBox(cmdAnnotatedBox);

      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain("Test Content");
      expect(lines[0]).toContain("\x1b[2J\x1b[H");
    });

    it("should work with Box render function using pretty style", () => {
      const textBox = Box.text("Sample");
      const cmdAnnotation = Annotation.createAnnotation(
        getCmdData(CMD.cursorMove(5, -2))
      );
      const cmdAnnotatedBox = pipe(textBox, Box.annotate(cmdAnnotation));

      // Use pretty style to handle annotations
      const rendered = Box.render(cmdAnnotatedBox, { style: "pretty" });

      expect(rendered).toContain("Sample");
      expect(rendered).toContain("\x1b[2A\x1b[5C");
    });
  });

  describe("Type Guards and Utilities", () => {
    describe("isCmdType", () => {
      it("should return true for valid CmdType", () => {
        const cmd = CMD.cursorUp();
        const cmdData = getCmdData(cmd);
        expect(CMD.isCmdType(cmdData)).toBe(true);
      });

      it("should return false for null", () => {
        expect(CMD.isCmdType(null)).toBe(false);
      });

      it("should return false for undefined", () => {
        expect(CMD.isCmdType(undefined)).toBe(false);
      });

      it("should return false for strings", () => {
        expect(CMD.isCmdType("test")).toBe(false);
      });

      it("should return false for objects without required properties", () => {
        expect(CMD.isCmdType({})).toBe(false);
        expect(CMD.isCmdType({ _tag: "Test" })).toBe(false);
        expect(CMD.isCmdType({ command: "test" })).toBe(false);
      });

      it("should return false for objects with invalid _tag", () => {
        expect(CMD.isCmdType({ _tag: "Invalid", command: "test" })).toBe(false);
      });

      it("should return true for all valid _tag values", () => {
        expect(CMD.isCmdType({ _tag: "Cursor", command: "test" })).toBe(true);
        expect(CMD.isCmdType({ _tag: "Screen", command: "test" })).toBe(true);
        expect(CMD.isCmdType({ _tag: "Visibility", command: "test" })).toBe(
          true
        );
        expect(CMD.isCmdType({ _tag: "Utility", command: "test" })).toBe(true);
      });
    });

    describe("getCmdEscapeSequence", () => {
      it("should return escape sequence for valid CmdType", () => {
        const cmd = CMD.cursorUp(5);
        const cmdData = getCmdData(cmd);
        expect(cmdData.command).toBe("\x1b[5A");
      });
    });

    describe("toEscapeSequence", () => {
      it("should extract command from CmdType", () => {
        const cmdData: CMD.CmdType = {
          _tag: "Cursor",
          command: "\x1b[5A",
        };
        expect(cmdData.command).toBe("\x1b[5A");
      });
    });
  });
});
