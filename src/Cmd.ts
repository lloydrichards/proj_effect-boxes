import { Array, Option, pipe } from "effect";
import { createAnnotation } from "./Annotation";
import type { AnsiStyle } from "./Ansi";
import { annotate, type Box, nullBox } from "./Box";

// ANSI escape sequence constants
const ESC = "\x1b";
const CSI = `${ESC}[`;

/**
 * Clamps a number to ensure it's non-negative
 */
const clamp = (n: number): number => Math.max(0, Math.floor(n));

/**
 * Creates a Cmd-annotated null box with the specified command
 */
const createCmdBox = (name: string, code: string): Box<AnsiStyle> => {
  const style: AnsiStyle = [
    {
      _tag: "CommandAttribute",
      name,
      code,
    },
  ];
  return annotate(nullBox, createAnnotation(style));
};

//  --------------------------------------------------------------------------------
//  --  Cursor Movement Commands  --------------------------------------------------
//  --------------------------------------------------------------------------------

/**
 * Moves the cursor up by the specified number of lines (default: 1).
 */
export const cursorUp = (lines = 1): Box<AnsiStyle> =>
  createCmdBox("cursorUp", `${CSI}${clamp(lines)}A`);

/**
 * Moves the cursor down by the specified number of lines (default: 1).
 */
export const cursorDown = (lines = 1): Box<AnsiStyle> =>
  createCmdBox("cursorDown", `${CSI}${clamp(lines)}B`);

/**
 * Moves the cursor right by the specified number of columns (default: 1).
 */
export const cursorForward = (columns = 1): Box<AnsiStyle> =>
  createCmdBox("cursorForward", `${CSI}${clamp(columns)}C`);

/**
 * Moves the cursor left by the specified number of columns (default: 1).
 */
export const cursorBackward = (columns = 1): Box<AnsiStyle> =>
  createCmdBox("cursorBackward", `${CSI}${clamp(columns)}D`);

/**
 * Moves the cursor to the specified position (0-based coordinates).
 */
export const cursorTo = (column = 0, row = 0): Box<AnsiStyle> =>
  createCmdBox("cursorTo", `${CSI}${clamp(row) + 1};${clamp(column) + 1}H`);

/**
 * Moves the cursor by the specified offset relative to current position.
 * Positive values move right/down, negative values move left/up.
 */
export const cursorMove = (column = 0, row = 0): Box<AnsiStyle> =>
  createCmdBox(
    "cursorMove",
    pipe(
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
    )
  );

/**
 * Moves the cursor to the beginning of the next line, specified number of rows down.
 */
export const cursorNextLine = (rows = 1): Box<AnsiStyle> =>
  createCmdBox("cursorNextLine", `${CSI}${clamp(rows)}E`);

/**
 * Moves the cursor to the beginning of the previous line, specified number of rows up.
 */
export const cursorPrevLine = (rows = 1): Box<AnsiStyle> =>
  createCmdBox("cursorPrevLine", `${CSI}${clamp(rows)}F`);

/*
 *  --------------------------------------------------------------------------------
 *  --  Position Save/Restore Commands  --------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Saves the current cursor position, encoding shift state, and formatting attributes.
 */
export const cursorSavePosition: Box<AnsiStyle> = createCmdBox(
  "cursorSavePosition",
  `${ESC}7`
);

/**
 * Restores the cursor to the last saved position with encoding shift state and formatting.
 */
export const cursorRestorePosition: Box<AnsiStyle> = createCmdBox(
  "cursorRestorePosition",
  `${ESC}8`
);

/*
 *  --------------------------------------------------------------------------------
 *  --  Cursor Visibility Commands  ------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Makes the cursor visible in the terminal.
 */
export const cursorShow: Box<AnsiStyle> = createCmdBox(
  "cursorShow",
  `${CSI}?25h`
);

/**
 * Hides the cursor in the terminal.
 */
export const cursorHide: Box<AnsiStyle> = createCmdBox(
  "cursorHide",
  `${CSI}?25l`
);

/*
 *  --------------------------------------------------------------------------------
 *  --  Screen Erase Commands  -----------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Clears the entire screen and moves cursor to top-left position.
 */
export const eraseScreen: Box<AnsiStyle> = createCmdBox(
  "eraseScreen",
  `${CSI}2J`
);

/**
 * Clears the screen from current cursor position to the beginning.
 */
export const eraseUp: Box<AnsiStyle> = createCmdBox("eraseUp", `${CSI}1J`);

/**
 * Clears the screen from current cursor position to the end.
 */
export const eraseDown: Box<AnsiStyle> = createCmdBox("eraseDown", `${CSI}0J`);

/**
 * Clears the entire current line. The cursor position remains unchanged.
 */
export const eraseLine: Box<AnsiStyle> = createCmdBox("eraseLine", `${CSI}2K`);

/**
 * Clears the current line from cursor position to the beginning.
 */
export const eraseStartLine: Box<AnsiStyle> = createCmdBox(
  "eraseStartLine",
  `${CSI}1K`
);

/**
 * Clears the current line from cursor position to the end.
 */
export const eraseEndLine: Box<AnsiStyle> = createCmdBox(
  "eraseEndLine",
  `${CSI}0K`
);

/**
 * Erases content from current cursor position upwards by specified number of rows.
 */
export const eraseLines = (rows: number): Box<AnsiStyle> =>
  createCmdBox("eraseLines", `${CSI}${clamp(rows)}M`);

/*
 *  --------------------------------------------------------------------------------
 *  --  Utility Commands  ----------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Clears the entire screen and moves cursor to home position (0,0).
 */
export const clearScreen: Box<AnsiStyle> = createCmdBox(
  "clearScreen",
  `${CSI}2J${CSI}H`
);

/**
 * Moves the cursor to the home position (top-left corner, 0,0).
 */
export const home: Box<AnsiStyle> = createCmdBox("home", `${CSI}H`);

/**
 * Triggers the terminal bell (beep sound).
 */
export const bell: Box<AnsiStyle> = createCmdBox("bell", "\x07");
