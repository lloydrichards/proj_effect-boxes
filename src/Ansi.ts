import type { Annotation } from "./Annotation";
import type { Box } from "./Box";
import * as internal from "./internal/ansi";

/**
 * Discriminated union for all ANSI styling options
 */
export type AnsiAttribute = {
  readonly _tag:
    | "ForegroundColor"
    | "BackgroundColor"
    | "TextAttribute"
    | "CommandAttribute";
  readonly name: string;
  readonly code: string;
};

/**
 * Array of ANSI attributes representing combined styles
 */
export type AnsiStyle = readonly AnsiAttribute[];

/**
 * ANSI annotation type that wraps ANSI styles in the Annotation system
 */
export type AnsiAnnotation = Annotation<AnsiStyle>;

// --------------------------------------------------------------------------------
// --  ANSI Color Constants  ------------------------------------------------------
// --------------------------------------------------------------------------------

// Standard ANSI colors - basic 8-color palette
// Each color has both foreground and background codes
export const black: AnsiAnnotation = internal.black;
export const red: AnsiAnnotation = internal.red;
export const green: AnsiAnnotation = internal.green;
export const yellow: AnsiAnnotation = internal.yellow;
export const blue: AnsiAnnotation = internal.blue;
export const magenta: AnsiAnnotation = internal.magenta;
export const cyan: AnsiAnnotation = internal.cyan;
export const white: AnsiAnnotation = internal.white;
export const fgDefault: AnsiAnnotation = internal.fgDefault;
export const color256: (n: number) => AnsiAnnotation = internal.color256;
export const colorRGB: (r: number, g: number, b: number) => AnsiAnnotation =
  internal.colorRGB;

//
// Background color constants - aliases to the main color constants
// Provided for API convenience and consistency with other ANSI libraries
//
export const bgBlack: AnsiAnnotation = internal.bgBlack;
export const bgRed: AnsiAnnotation = internal.bgRed;
export const bgGreen: AnsiAnnotation = internal.bgGreen;
export const bgYellow: AnsiAnnotation = internal.bgYellow;
export const bgBlue: AnsiAnnotation = internal.bgBlue;
export const bgMagenta: AnsiAnnotation = internal.bgMagenta;
export const bgCyan: AnsiAnnotation = internal.bgCyan;
export const bgWhite: AnsiAnnotation = internal.bgWhite;
export const bgDefault: AnsiAnnotation = internal.bgDefault;
export const bgColor256: (n: number) => AnsiAnnotation = internal.bgColor256;
export const bgColorRGB: (r: number, g: number, b: number) => AnsiAnnotation =
  internal.bgColorRGB;

//
// --------------------------------------------------------------------------------
// --  Standard ANSI text attributes  ---------------------------------------------
// --------------------------------------------------------------------------------
//

//
// Standard ANSI text formatting attributes
//
export const bold: AnsiAnnotation = internal.bold;
export const dim: AnsiAnnotation = internal.dim;
export const italic: AnsiAnnotation = internal.italic;
export const underlined: AnsiAnnotation = internal.underlined;
export const blink: AnsiAnnotation = internal.blink;
export const inverse: AnsiAnnotation = internal.inverse;
export const hidden: AnsiAnnotation = internal.hidden;
export const strikethrough: AnsiAnnotation = internal.strikethrough;
export const overline: AnsiAnnotation = internal.overline;
export const reset: AnsiAnnotation = internal.reset;

//
// --------------------------------------------------------------------------------
// --  Combine  -------------------------------------------------------------------
// --------------------------------------------------------------------------------
//

/**
 * Combines multiple ANSI style annotations into a single array of AnsiStyleType,
 * resolving conflicts with a last-wins strategy.
 *
 * @param annotations - An array of AnsiAnnotation to combine.
 * @returns A new AnsiAnnotation containing an array of resolved AnsiStyleType.
 */
export const combine: (...annotations: AnsiAnnotation[]) => AnsiAnnotation =
  internal.combine;

/*
 *  --------------------------------------------------------------------------------
 *  --  Rendering  -----------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Extracts ANSI escape sequence from annotation data if it's ANSI-related
 * Styled sequences (colors, text effects) join codes with ';' and end with 'm'
 * Command sequences (cursor movement, erase) use their specific format
 */
export const getAnsiEscapeSequence: (data: AnsiStyle) => string | null =
  internal.getAnsiEscapeSequence;

/**
 * Converts a box into an array of text lines for display with ANSI annotation support.
 * @param self - The box to render as text lines
 *
 * @note Haskell: `renderBox :: Box -> [String]`
 */
export const renderAnnotatedBox: <A>({
  cols,
  content,
  rows,
  annotation,
}: Box<A>) => string[] = internal.renderAnnotatedBox;
