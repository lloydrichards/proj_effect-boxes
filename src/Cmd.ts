/**
 * @fileoverview Terminal control commands that integrate seamlessly with Box layout system.
 *
 * This module provides ANSI terminal control commands as Box<CmdType> constants
 * that can be composed using the standard Box composition functions for powerful
 * terminal UI layouts.
 *
 * @example Basic cursor positioning and text output
 * ```typescript
 * import * as Box from "./Box";
 * import * as Cmd from "./Cmd";
 *
 * const layout = Cmd.cursorSavePosition.pipe(
 *   Box.hAppend(Box.text("Hello ")),
 *   Box.hAppend(Box.text("World")),
 *   Box.hAppend(Cmd.cursorRestorePosition)
 * );
 * ```
 *
 * @example Complex layout with error display
 * ```typescript
 * const errorMessage = ["Error on line 1", "Invalid syntax", "Check your code"];
 * const errorLines = errorMessage.map(Box.text);
 *
 * const errorDisplay = Cmd.cursorSavePosition.pipe(
 *   Box.hAppend(Box.text("→ ")),
 *   Box.hAppend(Box.alignLeft(Box.vcat(errorLines, Box.left))),
 *   Box.hAppend(Cmd.cursorRestorePosition)
 * );
 * ```
 *
 * @example Partial screen updates with cursor positioning
 * ```typescript
 * const updateProgressBar = (progress: number) =>
 *   Cmd.cursorTo(10, 5).pipe(
 *     Box.hAppend(ProgressBar(progress, 100)),
 *     Box.hAppend(Cmd.cursorHide)
 *   );
 * ```
 */

import { Array, Option, pipe } from "effect";
import { createAnnotation } from "./Annotation";
import { annotate, type Box, nullBox } from "./Box";
import type { CmdType } from "./utils";
export { isCmdType, type CmdType } from "./utils";
/**
 * ANSI escape sequence constants
 */
const ESC = "\x1b";
const CSI = `${ESC}[`;

/**
 * Clamps a number to ensure it's non-negative
 */
const clamp = (n: number): number => Math.max(0, Math.floor(n));

/**
 * Creates a Cmd-annotated null box with the specified command
 */
const createCmdBox = (cmd: CmdType): Box<CmdType> =>
  annotate(nullBox, createAnnotation(cmd));

/*
 *  --------------------------------------------------------------------------------
 *  --  Cursor Movement Commands  --------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Moves the cursor up by the specified number of lines (default: 1).
 * If the cursor is at the top edge, it has no effect.
 */
export const cursorUp = (lines = 1): Box<CmdType> =>
  createCmdBox({ _tag: "Cursor", command: `${CSI}${clamp(lines)}A` });

/**
 * Moves the cursor down by the specified number of lines (default: 1).
 * If the cursor is at the bottom edge, it has no effect.
 */
export const cursorDown = (lines = 1): Box<CmdType> =>
  createCmdBox({ _tag: "Cursor", command: `${CSI}${clamp(lines)}B` });

/**
 * Moves the cursor left by the specified number of columns (default: 1).
 * If the cursor is at the left edge, it has no effect.
 */
export const cursorLeft = (columns = 1): Box<CmdType> =>
  createCmdBox({ _tag: "Cursor", command: `${CSI}${clamp(columns)}D` });

/**
 * Moves the cursor right by the specified number of columns (default: 1).
 * If the cursor is at the right edge, it has no effect.
 */
export const cursorRight = (columns = 1): Box<CmdType> =>
  createCmdBox({ _tag: "Cursor", command: `${CSI}${clamp(columns)}C` });

/**
 * Moves the cursor forward by the specified number of columns (default: 1).
 * Alias for cursorRight for API compatibility with @effect/printer-ansi.
 */
export const cursorForward = (columns = 1): Box<CmdType> =>
  createCmdBox({ _tag: "Cursor", command: `${CSI}${clamp(columns)}C` });

/**
 * Moves the cursor backward by the specified number of columns (default: 1).
 * Alias for cursorLeft for API compatibility with @effect/printer-ansi.
 */
export const cursorBackward = (columns = 1): Box<CmdType> =>
  createCmdBox({ _tag: "Cursor", command: `${CSI}${clamp(columns)}D` });

/**
 * Moves the cursor to the specified position (0-based coordinates).
 * The coordinates are converted to 1-based for ANSI compatibility.
 */
export const cursorTo = (column = 0, row = 0): Box<CmdType> =>
  createCmdBox({
    _tag: "Cursor",
    command: `${CSI}${clamp(row) + 1};${clamp(column) + 1}H`,
  });

/**
 * Moves the cursor by the specified offset relative to current position.
 * Positive values move right/down, negative values move left/up.
 */
export const cursorMove = (column = 0, row = 0): Box<CmdType> =>
  createCmdBox({
    _tag: "Cursor",
    command: pipe(
      [
        Option.liftPredicate(
          { value: clamp(Math.abs(row)), code: row > 0 ? "B" : "A" },
          (v) => v.value !== 0
        ),
        Option.liftPredicate(
          { value: clamp(Math.abs(column)), code: column > 0 ? "C" : "D" },
          (v) => v.value !== 0
        ),
      ],
      Array.filterMap((movement) => movement),
      Array.map((movement) => `${CSI}${movement.value}${movement.code}`),
      Array.join("")
    ),
  });

/**
 * Moves the cursor to the beginning of the next line, specified number of rows down.
 */
export const cursorNextLine = (rows = 1): Box<CmdType> =>
  createCmdBox({ _tag: "Cursor", command: `${CSI}${clamp(rows)}E` });

/**
 * Moves the cursor to the beginning of the previous line, specified number of rows up.
 */
export const cursorPrevLine = (rows = 1): Box<CmdType> =>
  createCmdBox({ _tag: "Cursor", command: `${CSI}${clamp(rows)}F` });

/*
 *  --------------------------------------------------------------------------------
 *  --  Position Save/Restore Commands  --------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Saves the current cursor position, encoding shift state, and formatting attributes.
 * Uses DEC sequence (ESC 7) which is recommended over SCO sequence.
 *
 * @example Composing with Box layout functions
 * ```typescript
 * const temporaryMessage = Cmd.cursorSavePosition.pipe(
 *   Box.hAppend(Box.text("Loading...")),
 *   Box.hAppend(Cmd.cursorRestorePosition)
 * );
 * ```
 */
export const cursorSavePosition: Box<CmdType> = createCmdBox({
  _tag: "Cursor",
  command: `${ESC}7`,
});

/**
 * Restores the cursor to the last saved position with encoding shift state and formatting.
 * Uses DEC sequence (ESC 8) which is recommended over SCO sequence.
 *
 * @example Multi-line error display with cursor restoration
 * ```typescript
 * const errorLines = errors.map(Box.text);
 * const errorDisplay = Cmd.cursorSavePosition.pipe(
 *   Box.hAppend(Box.text("→ ")),
 *   Box.hAppend(Box.alignLeft(Box.vcat(errorLines, Box.left))),
 *   Box.hAppend(Cmd.cursorRestorePosition)
 * );
 * ```
 */
export const cursorRestorePosition: Box<CmdType> = createCmdBox({
  _tag: "Cursor",
  command: `${ESC}8`,
});

/*
 *  --------------------------------------------------------------------------------
 *  --  Cursor Visibility Commands  ------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Makes the cursor visible in the terminal.
 */
export const cursorShow: Box<CmdType> = createCmdBox({
  _tag: "Visibility",
  command: `${CSI}?25h`,
});

/**
 * Hides the cursor in the terminal.
 */
export const cursorHide: Box<CmdType> = createCmdBox({
  _tag: "Visibility",
  command: `${CSI}?25l`,
});

/*
 *  --------------------------------------------------------------------------------
 *  --  Screen Erase Commands  -----------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Clears the entire screen and moves cursor to top-left position.
 */
export const eraseScreen: Box<CmdType> = createCmdBox({
  _tag: "Screen",
  command: `${CSI}2J`,
});

/**
 * Clears the screen from current cursor position to the beginning.
 * The cursor position remains unchanged.
 */
export const eraseUp: Box<CmdType> = createCmdBox({
  _tag: "Screen",
  command: `${CSI}1J`,
});

/**
 * Clears the screen from current cursor position to the end.
 * The cursor position remains unchanged.
 */
export const eraseDown: Box<CmdType> = createCmdBox({
  _tag: "Screen",
  command: `${CSI}0J`,
});

/**
 * Clears the entire current line. The cursor position remains unchanged.
 */
export const eraseLine: Box<CmdType> = createCmdBox({
  _tag: "Screen",
  command: `${CSI}2K`,
});

/**
 * Clears the current line from cursor position to the beginning.
 * The cursor position remains unchanged.
 */
export const eraseStartLine: Box<CmdType> = createCmdBox({
  _tag: "Screen",
  command: `${CSI}1K`,
});

/**
 * Clears the current line from cursor position to the end.
 * The cursor position remains unchanged.
 */
export const eraseEndLine: Box<CmdType> = createCmdBox({
  _tag: "Screen",
  command: `${CSI}0K`,
});

/**
 * Erases content from current cursor position upwards by specified number of rows.
 */
export const eraseLines = (rows: number): Box<CmdType> =>
  createCmdBox({ _tag: "Screen", command: `${CSI}${clamp(rows)}M` });

/*
 *  --------------------------------------------------------------------------------
 *  --  Utility Commands  ----------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Clears the entire screen and moves cursor to home position (0,0).
 * Convenience function combining eraseScreen and cursorTo(0,0).
 */
export const clearScreen: Box<CmdType> = createCmdBox({
  _tag: "Screen",
  command: `${CSI}2J${CSI}H`,
});

/**
 * Moves the cursor to the home position (top-left corner, 0,0).
 */
export const home: Box<CmdType> = createCmdBox({
  _tag: "Utility",
  command: `${CSI}H`,
});

/**
 * Triggers the terminal bell (beep sound).
 */
export const bell: Box<CmdType> = createCmdBox({
  _tag: "Utility",
  command: "\x07",
});
