import { pipe } from "effect";
import { describe, expect, it } from "vitest";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";
import * as Cmd from "../src/Cmd";

describe("CMD Module", () => {
  describe("Cursor Movement Commands", () => {
    describe("cursorUp", () => {
      it("should create box with correct escape sequence for default value", () => {
        const cmd = Cmd.cursorUp();
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[1A");
      });

      it("should create box with correct escape sequence for custom value", () => {
        const cmd = Cmd.cursorUp(5);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[5A");
      });

      it("should clamp negative values to 0", () => {
        const cmd = Cmd.cursorUp(-3);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[0A");
      });

      it("should floor decimal values", () => {
        const cmd = Cmd.cursorUp(3.7);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[3A");
      });
    });

    describe("cursorDown", () => {
      it("should create box with correct escape sequence for default value", () => {
        const cmd = Cmd.cursorDown();
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[1B");
      });

      it("should create box with correct escape sequence for custom value", () => {
        const cmd = Cmd.cursorDown(3);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[3B");
      });

      it("should clamp negative values to 0", () => {
        const cmd = Cmd.cursorDown(-2);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[0B");
      });
    });

    describe("cursorForward", () => {
      it("should create box with correct escape sequence for default value", () => {
        const cmd = Cmd.cursorForward();
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[1C");
      });

      it("should create box with correct escape sequence for custom value", () => {
        const cmd = Cmd.cursorForward(7);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[7C");
      });

      it("should clamp negative values to 0", () => {
        const cmd = Cmd.cursorForward(-1);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[0C");
      });
    });

    describe("cursorBackward", () => {
      it("should create box with correct escape sequence for default value", () => {
        const cmd = Cmd.cursorBackward();
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[1D");
      });

      it("should create box with correct escape sequence for custom value", () => {
        const cmd = Cmd.cursorBackward(4);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[4D");
      });

      it("should clamp negative values to 0", () => {
        const cmd = Cmd.cursorBackward(-5);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[0D");
      });
    });

    // Note: cursorTo and cursorMove use dual functions, so we test them differently
    describe("cursorTo", () => {
      it("should position cursor at specific coordinates (data-first)", () => {
        const cmd = Cmd.cursorTo(5, 3);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[4;6H");
      });

      it("should position cursor at column only (row defaults to 0)", () => {
        const cmd = Cmd.cursorTo(10);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[1;11H");
      });

      it("should handle zero coordinates", () => {
        const cmd = Cmd.cursorTo(0, 0);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[1;1H");
      });

      it("should clamp negative coordinates", () => {
        const cmd = Cmd.cursorTo(-2, -1);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[1;1H");
      });
    });

    describe("cursorMove", () => {
      it("should move cursor right and down with positive values", () => {
        const cmd = Cmd.cursorMove(3, 2);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[2B\x1b[3C");
      });

      it("should move cursor left and up with negative values", () => {
        const cmd = Cmd.cursorMove(-4, -1);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[1A\x1b[4D");
      });

      it("should handle column only movement (row defaults to 0)", () => {
        const cmd = Cmd.cursorMove(5);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[5C");
      });

      it("should handle zero movement", () => {
        const cmd = Cmd.cursorMove(0, 0);
        expect(cmd.annotation?.data[0]?.code).toBe("");
      });

      it("should handle mixed positive/negative movement", () => {
        const cmd = Cmd.cursorMove(-2, 3);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[3B\x1b[2D");
      });
    });
  });

  describe("Line Navigation Commands", () => {
    describe("cursorNextLine", () => {
      it("should move to next line with default value", () => {
        const cmd = Cmd.cursorNextLine();
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[1E");
      });

      it("should move to next line with custom value", () => {
        const cmd = Cmd.cursorNextLine(3);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[3E");
      });

      it("should clamp negative values", () => {
        const cmd = Cmd.cursorNextLine(-2);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[0E");
      });
    });

    describe("cursorPrevLine", () => {
      it("should move to previous line with default value", () => {
        const cmd = Cmd.cursorPrevLine();
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[1F");
      });

      it("should move to previous line with custom value", () => {
        const cmd = Cmd.cursorPrevLine(2);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[2F");
      });

      it("should clamp negative values", () => {
        const cmd = Cmd.cursorPrevLine(-1);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[0F");
      });
    });
  });

  describe("Position Save/Restore Commands", () => {
    describe("cursorSavePosition", () => {
      it("should generate DEC save position sequence", () => {
        const cmd = Cmd.cursorSavePosition;
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b7");
      });
    });

    describe("cursorRestorePosition", () => {
      it("should generate DEC restore position sequence", () => {
        const cmd = Cmd.cursorRestorePosition;
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b8");
      });
    });
  });

  describe("Cursor Visibility Commands", () => {
    describe("cursorShow", () => {
      it("should generate cursor show sequence", () => {
        const cmd = Cmd.cursorShow;
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[?25h");
      });
    });

    describe("cursorHide", () => {
      it("should generate cursor hide sequence", () => {
        const cmd = Cmd.cursorHide;
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[?25l");
      });
    });
  });

  describe("Screen Erase Commands", () => {
    describe("eraseScreen", () => {
      it("should generate clear entire screen sequence", () => {
        const cmd = Cmd.eraseScreen;
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[2J");
      });
    });

    describe("eraseUp", () => {
      it("should generate clear up to cursor sequence", () => {
        const cmd = Cmd.eraseUp;
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[1J");
      });
    });

    describe("eraseDown", () => {
      it("should generate clear down from cursor sequence", () => {
        const cmd = Cmd.eraseDown;
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[0J");
      });
    });

    describe("eraseLine", () => {
      it("should generate clear entire line sequence", () => {
        const cmd = Cmd.eraseLine;
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[2K");
      });
    });

    describe("eraseStartLine", () => {
      it("should generate clear line from start to cursor sequence", () => {
        const cmd = Cmd.eraseStartLine;
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[1K");
      });
    });

    describe("eraseEndLine", () => {
      it("should generate clear line from cursor to end sequence", () => {
        const cmd = Cmd.eraseEndLine;
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[0K");
      });
    });

    describe("eraseLines", () => {
      it("should generate erase multiple lines sequence", () => {
        const cmd = Cmd.eraseLines(5);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[5M");
      });

      it("should clamp negative values", () => {
        const cmd = Cmd.eraseLines(-3);
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[0M");
      });
    });
  });

  describe("Utility Commands", () => {
    describe("clearScreen", () => {
      it("should generate combined clear screen and home sequence", () => {
        const cmd = Cmd.clearScreen;
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[2J\x1b[H");
      });
    });

    describe("home", () => {
      it("should generate home position sequence", () => {
        const cmd = Cmd.home;
        expect(cmd.annotation?.data[0]?.code).toBe("\x1b[H");
      });
    });

    describe("bell", () => {
      it("should generate bell sequence", () => {
        const cmd = Cmd.bell;
        expect(cmd.annotation?.data[0]?.code).toBe("\x07");
      });
    });
  });

  describe("CmdType Properties", () => {
    it("should have correct _tag for all commands", () => {
      const cmd = Cmd.cursorUp();
      expect(cmd.annotation?.data[0]?._tag).toBe("CommandAttribute");
    });

    it("should have correct name for a command", () => {
      const cmd = Cmd.eraseScreen;
      expect(cmd.annotation?.data[0]?.name).toBe("eraseScreen");
    });
  });

  describe("Box Integration", () => {
    it("should create null boxes with single annotation", () => {
      const cmd = Cmd.cursorUp(5);
      expect(cmd.rows).toBe(0);
      expect(cmd.cols).toBe(0);
      expect(cmd.annotation).toBeDefined();
    });

    it("should be composable with other boxes", () => {
      const textBox = Box.text("Hello");
      const cmd = Cmd.cursorUp(2);
      const combined = Box.hAppend(cmd, textBox);

      expect(combined.rows).toBe(1); // Text box height
      expect(combined.cols).toBe(5); // Text box width
      // Note: Composition functions create new boxes and don't preserve individual annotations
      // This is expected behavior as the combined box represents a layout, not a command
    });

    it("should work with pipe operations", () => {
      const result = pipe(Cmd.cursorUp(3), (cmd) =>
        Box.hAppend(cmd, Box.text("Test"))
      );

      expect(result.rows).toBe(1);
      expect(result.cols).toBe(4); // "Test" length
      // Combined boxes don't preserve individual annotations
    });

    it("should maintain CMD annotation when used standalone", () => {
      const cmd = Cmd.cursorUp(3);
      expect(cmd.annotation).toBeDefined();
      expect(cmd.annotation?.data[0]?.code).toBe("\x1b[3A");
    });
  });

  describe("CMD-Ansi Integration", () => {
    it("should render CMD-annotated boxes through the Ansi module", () => {
      const cmd = Cmd.cursorUp(3);
      const lines = Ansi.renderAnnotatedBox(cmd);

      // CMD boxes are null boxes (0 rows, 0 cols), so they return their escape code
      expect(lines).toEqual(["\x1b[3A"]);
    });

    it("should integrate CMD annotations with text content", () => {
      const cmd = Cmd.cursorUp(2);
      if (!cmd.annotation) {
        throw new Error("Command box annotation is missing");
      }
      const cmdAnnotatedBox = Box.text("Hello World").pipe(
        Box.annotate(cmd.annotation)
      );

      const lines = Ansi.renderAnnotatedBox(cmdAnnotatedBox);

      // Should render text with CMD escape sequence applied
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain("Hello World");
      expect(lines[0]).toContain("\x1b[2A");
    });

    it("should handle complex CMD-annotated layouts", () => {
      const cmd = Cmd.clearScreen;
      if (!cmd.annotation) {
        throw new Error("Command box annotation is missing");
      }
      const content = Box.text("Test Content").pipe(
        Box.annotate(cmd.annotation)
      );
      const lines = Ansi.renderAnnotatedBox(content);

      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain("Test Content");
      expect(lines[0]).toContain("\x1b[2J\x1b[H");
    });
  });

  describe("Composition API", () => {
    describe("Constants for Composition", () => {
      it("should allow direct composition with Box.hcat", () => {
        const layout = Box.hcat(
          [
            Cmd.cursorSavePosition,
            Box.text("Hello"),
            Cmd.cursorRestorePosition,
          ],
          Box.left
        );

        expect(layout.rows).toBe(1);
        expect(layout.cols).toBe(5); // "Hello" length
      });

      it("should work with Box.hAppend pipeline", () => {
        const result = Box.hAppend(
          Box.hAppend(Cmd.cursorSavePosition, Box.text("Test")),
          Cmd.cursorRestorePosition
        );

        expect(result.rows).toBe(1);
        expect(result.cols).toBe(4); // "Test" length
      });

      it("should compose with Box.alignLeft", () => {
        const lines = [Box.text("Line 1"), Box.text("Line 2")];
        const aligned = Box.alignLeft(Box.vcat(lines, Box.left));
        const layout = Box.hcat(
          [Cmd.cursorSavePosition, aligned, Cmd.cursorRestorePosition],
          Box.left
        );

        expect(layout.rows).toBe(2);
        expect(layout.cols).toBe(6); // "Line 1" length
      });

      it("should work in complex layouts", () => {
        const errorLines = Box.text("Error occurred\n\nOn line 2");
        const prefix = Box.text("→ ");

        const layout = Box.hcat(
          [
            Cmd.cursorSavePosition,
            Box.text("\n"),
            prefix,
            Box.alignLeft(errorLines),
            Cmd.cursorRestorePosition,
          ],
          Box.left
        );

        expect(layout.rows).toBe(3); // newline + 2 error lines
        expect(layout.cols).toBe(16); // "→ Error occurred" length
      });
    });

    describe("Mixed Command Composition", () => {
      it("should compose different command types", () => {
        const layout = Box.hcat(
          [Cmd.clearScreen, Cmd.home, Box.text("Welcome"), Cmd.cursorHide],
          Box.left
        );

        expect(layout.rows).toBe(1);
        expect(layout.cols).toBe(7); // "Welcome" length
      });

      it("should work with cursor positioning functions", () => {
        const positioned = Box.hcat(
          [Cmd.cursorTo(10, 5), Box.text("At position (10,5)"), Cmd.cursorShow],
          Box.left
        );

        expect(positioned.rows).toBe(1);
        expect(positioned.cols).toBe(18); // message length
      });
    });

    describe("Rendering Composed Commands", () => {
      it("should render command sequences properly", () => {
        const layout = Box.hcat(
          [
            Cmd.cursorSavePosition,
            Box.text("Hello"),
            Cmd.cursorRestorePosition,
          ],
          Box.left
        );

        const rendered = Ansi.renderAnnotatedBox(layout);

        // Should contain the text and escape sequences from the commands
        expect(rendered.join("")).toContain("Hello");
        expect(rendered.join("")).toContain("\x1b7"); // save position
        expect(rendered.join("")).toContain("\x1b8"); // restore position
      });
    });
  });
});
