import type { AnsiStyle } from "./Ansi";
import type { Box } from "./Box";
import * as internalAnsi from "./internal/cmd";

//  --------------------------------------------------------------------------------
//  --  Cursor Movement Commands  --------------------------------------------------
//  --------------------------------------------------------------------------------

/**
 * Moves the cursor up by the specified number of lines (default: 1).
 */
export const cursorUp: (lines: number) => Box<AnsiStyle> =
  internalAnsi.cursorUp;

/**
 * Moves the cursor down by the specified number of lines (default: 1).
 */
export const cursorDown: (lines: number) => Box<AnsiStyle> =
  internalAnsi.cursorDown;

/**
 * Moves the cursor right by the specified number of columns (default: 1).
 */
export const cursorForward: (columns: number) => Box<AnsiStyle> =
  internalAnsi.cursorForward;

/**
 * Moves the cursor left by the specified number of columns (default: 1).
 */
export const cursorBackward: (columns: number) => Box<AnsiStyle> =
  internalAnsi.cursorBackward;

/**
 * Moves the cursor to the specified position (0-based coordinates).
 */
export const cursorTo: (column: number, row: number) => Box<AnsiStyle> =
  internalAnsi.cursorTo;

/**
 * Moves the cursor by the specified offset relative to current position.
 * Positive values move right/down, negative values move left/up.
 */
export const cursorMove: (column: number, row: number) => Box<AnsiStyle> =
  internalAnsi.cursorMove;

/**
 * Moves the cursor to the beginning of the next line, specified number of rows down.
 */
export const cursorNextLine: (rows?: number) => Box<AnsiStyle> =
  internalAnsi.cursorNextLine;

/**
 * Moves the cursor to the beginning of the previous line, specified number of rows up.
 */
export const cursorPrevLine: (rows?: number) => Box<AnsiStyle> =
  internalAnsi.cursorPrevLine;

/*
 *  --------------------------------------------------------------------------------
 *  --  Position Save/Restore Commands  --------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Saves the current cursor position, encoding shift state, and formatting attributes.
 */
export const cursorSavePosition: Box<AnsiStyle> =
  internalAnsi.cursorSavePosition;

/**
 * Restores the cursor to the last saved position with encoding shift state and formatting.
 */
export const cursorRestorePosition: Box<AnsiStyle> =
  internalAnsi.cursorRestorePosition;

/*
 *  --------------------------------------------------------------------------------
 *  --  Cursor Visibility Commands  ------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Makes the cursor visible in the terminal.
 */
export const cursorShow: Box<AnsiStyle> = internalAnsi.cursorShow;

/**
 * Hides the cursor in the terminal.
 */
export const cursorHide: Box<AnsiStyle> = internalAnsi.cursorHide;

/*
 *  --------------------------------------------------------------------------------
 *  --  Screen Erase Commands  -----------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Clears the entire screen and moves cursor to top-left position.
 */
export const eraseScreen: Box<AnsiStyle> = internalAnsi.eraseScreen;
/**
 * Clears the screen from current cursor position to the beginning.
 */
export const eraseUp: Box<AnsiStyle> = internalAnsi.eraseUp;

/**
 * Clears the screen from current cursor position to the end.
 */
export const eraseDown: Box<AnsiStyle> = internalAnsi.eraseDown;

/**
 * Clears the entire current line. The cursor position remains unchanged.
 */
export const eraseLine: Box<AnsiStyle> = internalAnsi.eraseLine;

/**
 * Clears the current line from cursor position to the beginning.
 */
export const eraseStartLine: Box<AnsiStyle> = internalAnsi.eraseStartLine;

/**
 * Clears the current line from cursor position to the end.
 */
export const eraseEndLine: Box<AnsiStyle> = internalAnsi.eraseEndLine;

/**
 * Erases content from current cursor position upwards by specified number of rows.
 */
export const eraseLines: (rows: number) => Box<AnsiStyle> =
  internalAnsi.eraseLines;

/*
 *  --------------------------------------------------------------------------------
 *  --  Utility Commands  ----------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Clears the entire screen and moves cursor to home position (0,0).
 */
export const clearScreen: Box<AnsiStyle> = internalAnsi.clearScreen;

/**
 * Moves the cursor to the home position (top-left corner, 0,0).
 */
export const home: Box<AnsiStyle> = internalAnsi.home;

/**
 * Triggers the terminal bell (beep sound).
 */
export const bell: Box<AnsiStyle> = internalAnsi.bell;
