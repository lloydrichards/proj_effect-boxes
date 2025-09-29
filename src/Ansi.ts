import type { Annotation } from "./Annotation";
import type { Box } from "./Box";
import * as internal from "./internal/ansi";

/**
 * @category models
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
 * @category models
 */
export type AnsiStyle = readonly AnsiAttribute[];

/**
 * @category models
 */
export type AnsiAnnotation = Annotation<AnsiStyle>;

// --------------------------------------------------------------------------------
// --  ANSI Color Constants  ------------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Standard black foreground color.
 *
 * @category constructors
 */
export const black: AnsiAnnotation = internal.black;

/**
 * Standard red foreground color.
 *
 * @category constructors
 */
export const red: AnsiAnnotation = internal.red;

/**
 * Standard green foreground color.
 *
 * @category constructors
 */
export const green: AnsiAnnotation = internal.green;

/**
 * Standard yellow foreground color.
 *
 * @category constructors
 */
export const yellow: AnsiAnnotation = internal.yellow;

/**
 * Standard blue foreground color.
 *
 * @category constructors
 */
export const blue: AnsiAnnotation = internal.blue;

/**
 * Standard magenta foreground color.
 *
 * @category constructors
 */
export const magenta: AnsiAnnotation = internal.magenta;

/**
 * Standard cyan foreground color.
 *
 * @category constructors
 */
export const cyan: AnsiAnnotation = internal.cyan;

/**
 * Standard white foreground color.
 *
 * @category constructors
 */
export const white: AnsiAnnotation = internal.white;

/**
 * Default foreground color (terminal default).
 *
 * @category constructors
 */
export const fgDefault: AnsiAnnotation = internal.fgDefault;

/**
 * Creates a foreground color using 256-color palette.
 *
 * Uses the extended 256-color ANSI palette for more color options
 * beyond the basic 8 colors.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 * import * as Ansi from "effect-boxes/Ansi"
 *
 * const brightOrange = Ansi.color256(208)
 * const coloredText = Box.text("Bright orange text").pipe(
 *   Box.annotate(brightOrange)
 * )
 * ```
 *
 * @category constructors
 */
export const color256: (n: number) => AnsiAnnotation = internal.color256;

/**
 * Creates a foreground color using RGB values.
 *
 * Provides true color support with full RGB specification.
 * Each component should be between 0-255.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 * import * as Ansi from "effect-boxes/Ansi"
 *
 * const customPurple = Ansi.colorRGB(128, 0, 128)
 * const styledText = Box.text("Custom purple").pipe(
 *   Box.annotate(customPurple)
 * )
 * console.log(Box.renderSync(styledText, Box.pretty))
 * ```
 *
 * @category constructors
 */
export const colorRGB: (r: number, g: number, b: number) => AnsiAnnotation =
  internal.colorRGB;

/**
 * Black background color.
 *
 * @category constructors
 */
export const bgBlack: AnsiAnnotation = internal.bgBlack;

/**
 * Red background color.
 *
 * @category constructors
 */
export const bgRed: AnsiAnnotation = internal.bgRed;

/**
 * Green background color.
 *
 * @category constructors
 */
export const bgGreen: AnsiAnnotation = internal.bgGreen;

/**
 * Yellow background color.
 *
 * @category constructors
 */
export const bgYellow: AnsiAnnotation = internal.bgYellow;

/**
 * Blue background color.
 *
 * @category constructors
 */
export const bgBlue: AnsiAnnotation = internal.bgBlue;

/**
 * Magenta background color.
 *
 * @category constructors
 */
export const bgMagenta: AnsiAnnotation = internal.bgMagenta;

/**
 * Cyan background color.
 *
 * @category constructors
 */
export const bgCyan: AnsiAnnotation = internal.bgCyan;

/**
 * White background color.
 *
 * @category constructors
 */
export const bgWhite: AnsiAnnotation = internal.bgWhite;

/**
 * Default background color (terminal default).
 *
 * @category constructors
 */
export const bgDefault: AnsiAnnotation = internal.bgDefault;

/**
 * Creates a background color using 256-color palette.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 * import * as Ansi from "effect-boxes/Ansi"
 *
 * const highlighted = Box.text("Highlighted text").pipe(
 *   Box.annotate(Ansi.bgColor256(226)) // Bright yellow background
 * )
 * ```
 *
 * @category constructors
 */
export const bgColor256: (n: number) => AnsiAnnotation = internal.bgColor256;

/**
 * Creates a background color using RGB values.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 * import * as Ansi from "effect-boxes/Ansi"
 *
 * const softBackground = Ansi.bgColorRGB(240, 240, 240)
 * const subtleText = Box.text("Soft background").pipe(
 *   Box.annotate(softBackground)
 * )
 * ```
 *
 * @category constructors
 */
export const bgColorRGB: (r: number, g: number, b: number) => AnsiAnnotation =
  internal.bgColorRGB;

//
// --------------------------------------------------------------------------------
// --  Standard ANSI text attributes  ---------------------------------------------
// --------------------------------------------------------------------------------
//

/**
 * Bold text formatting.
 *
 * Makes text appear with increased weight/intensity.
 *
 * @category constructors
 */
export const bold: AnsiAnnotation = internal.bold;

/**
 * Dim text formatting.
 *
 * Makes text appear with reduced intensity.
 *
 * @category constructors
 */
export const dim: AnsiAnnotation = internal.dim;

/**
 * Italic text formatting.
 *
 * Makes text appear slanted (if supported by terminal).
 *
 * @category constructors
 */
export const italic: AnsiAnnotation = internal.italic;

/**
 * Underlined text formatting.
 *
 * Adds an underline beneath the text.
 *
 * @category constructors
 */
export const underlined: AnsiAnnotation = internal.underlined;

/**
 * Blinking text formatting.
 *
 * Makes text blink (if supported by terminal).
 *
 * @category constructors
 */
export const blink: AnsiAnnotation = internal.blink;

/**
 * Inverse text formatting.
 *
 * Swaps foreground and background colors.
 *
 * @category constructors
 */
export const inverse: AnsiAnnotation = internal.inverse;

/**
 * Hidden text formatting.
 *
 * Makes text invisible (useful for passwords).
 *
 * @category constructors
 */
export const hidden: AnsiAnnotation = internal.hidden;

/**
 * Strikethrough text formatting.
 *
 * Adds a line through the middle of the text.
 *
 * @category constructors
 */
export const strikethrough: AnsiAnnotation = internal.strikethrough;

/**
 * Overline text formatting.
 *
 * Adds a line above the text.
 *
 * @category constructors
 */
export const overline: AnsiAnnotation = internal.overline;

/**
 * Reset all formatting.
 *
 * Clears all ANSI formatting and returns to terminal defaults.
 *
 * @category constructors
 */
export const reset: AnsiAnnotation = internal.reset;

//
// --------------------------------------------------------------------------------
// --  Combine  -------------------------------------------------------------------
// --------------------------------------------------------------------------------
//

/**
 * Combines multiple ANSI style annotations into a single annotation.
 *
 * Merges multiple ANSI styling annotations using a last-wins strategy
 * for conflicting attributes. This allows you to layer styles like
 * combining color with formatting.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 * import * as Ansi from "effect-boxes/Ansi"
 *
 * const styledText = Box.text("Important Warning").pipe(
 *   Box.annotate(Ansi.combine(Ansi.red, Ansi.bold, Ansi.underlined))
 * )
 * console.log(Box.renderSync(styledText, Box.pretty))
 * // Outputs red, bold, underlined text
 * ```
 *
 *
 * @category combinators
 */
export const combine: (...annotations: AnsiAnnotation[]) => AnsiAnnotation =
  internal.combine;

/*
 *  --------------------------------------------------------------------------------
 *  --  Rendering  -----------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Extracts ANSI escape sequence from annotation data.
 *
 * Converts ANSI style data into the raw escape sequence string used
 * by terminals. Styled sequences (colors, text effects) join codes
 * with ';' and end with 'm'. Returns null for non-ANSI data.
 *
 * @example
 * ```typescript
 * import * as Ansi from "effect-boxes/Ansi"
 * import * as Annotation from "effect-boxes/Annotation"
 *
 * const redStyle = Annotation.get(Ansi.red)
 * const escapeSeq = Ansi.getAnsiEscapeSequence(redStyle)
 * console.log(escapeSeq)
 * // "\u001b[31m" (ANSI red foreground code)
 * ```
 *
 * @category utilities
 */
export const getAnsiEscapeSequence: (data: AnsiStyle) => string | null =
  internal.getAnsiEscapeSequence;

/**
 * Converts a box into an array of text lines with ANSI annotation support.
 *
 * Renders a box to text lines while preserving ANSI styling annotations.
 * This is the core function that bridges the Box layout system with
 * terminal ANSI output.
 *
 * @note Haskell: `renderBox :: Box -> [String]`
 * @category utilities
 */
export const renderAnnotatedBox: <A>({
  cols,
  content,
  rows,
  annotation,
}: Box<A>) => string[] = internal.renderAnnotatedBox;
