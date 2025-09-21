import { Array, Match, Option, pipe } from "effect";
import { dual } from "effect/Function";
import type { Annotation } from "./Annotation";
import { createAnnotation } from "./Annotation";
import {
  type Alignment,
  type Box,
  blanks,
  type Content,
  merge,
  takeP,
  takePA,
} from "./Box";
import * as Width from "./Width";

const segmenter = new Intl.Segmenter();

// ANSI escape sequence constants
const ESC = "\x1b";
const CSI = `${ESC}[`;
const RESET = `${CSI}0m`;

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

const makeForegroundColor = (name: string, code: string): AnsiAnnotation =>
  createAnnotation<AnsiStyle>([
    {
      _tag: "ForegroundColor",
      name,
      code,
    },
  ]);

const makeBackgroundColor = (name: string, code: string): AnsiAnnotation =>
  createAnnotation<AnsiStyle>([
    {
      _tag: "BackgroundColor",
      name,
      code,
    },
  ]);

const makeTextAttribute = (name: string, code: string): AnsiAnnotation =>
  createAnnotation<AnsiStyle>([
    {
      _tag: "TextAttribute",
      name,
      code,
    },
  ]);

// --------------------------------------------------------------------------------
// --  ANSI Color Constants  ------------------------------------------------------
// --------------------------------------------------------------------------------

// Standard ANSI colors - basic 8-color palette
// Each color has both foreground and background codes
export const black = makeForegroundColor("black", "30");
export const red = makeForegroundColor("red", "31");
export const green = makeForegroundColor("green", "32");
export const yellow = makeForegroundColor("yellow", "33");
export const blue = makeForegroundColor("blue", "34");
export const magenta = makeForegroundColor("magenta", "35");
export const cyan = makeForegroundColor("cyan", "36");
export const white = makeForegroundColor("white", "37");
export const fgDefault = makeForegroundColor("default", "39");
const clampColor = (n: number): number => Math.min(255, Math.max(0, n));
export const color256 = (n: number): AnsiAnnotation =>
  makeForegroundColor(`color256(${clampColor(n)})`, `38;5;${clampColor(n)}`);
export const colorRGB = (r: number, g: number, b: number): AnsiAnnotation =>
  makeForegroundColor(
    `rgb(${clampColor(r)},${clampColor(g)},${clampColor(b)})`,
    `38;2;${clampColor(r)};${clampColor(g)};${clampColor(b)}`
  );

//
// Background color constants - aliases to the main color constants
// Provided for API convenience and consistency with other ANSI libraries
//
export const bgBlack = makeBackgroundColor("black", "40");
export const bgRed = makeBackgroundColor("red", "41");
export const bgGreen = makeBackgroundColor("green", "42");
export const bgYellow = makeBackgroundColor("yellow", "43");
export const bgBlue = makeBackgroundColor("blue", "44");
export const bgMagenta = makeBackgroundColor("magenta", "45");
export const bgCyan = makeBackgroundColor("cyan", "46");
export const bgWhite = makeBackgroundColor("white", "47");
export const bgDefault = makeBackgroundColor("default", "49");
export const bgColor256 = (n: number): AnsiAnnotation =>
  makeBackgroundColor(`color256(${clampColor(n)})`, `48;5;${clampColor(n)}`);
export const bgColorRGB = (r: number, g: number, b: number): AnsiAnnotation =>
  makeBackgroundColor(
    `rgb(${clampColor(r)},${clampColor(g)},${clampColor(b)})`,
    `48;2;${clampColor(r)};${clampColor(g)};${clampColor(b)}`
  );

//
// --------------------------------------------------------------------------------
// --  Standard ANSI text attributes  ---------------------------------------------
// --------------------------------------------------------------------------------
//

//
// Standard ANSI text formatting attributes
//
export const bold = makeTextAttribute("bold", "1");

export const dim = makeTextAttribute("dim", "2");

export const italic = makeTextAttribute("italic", "3");

export const underlined = makeTextAttribute("underlined", "4");

export const blink = makeTextAttribute("blink", "5");

export const inverse = makeTextAttribute("inverse", "7");

export const hidden = makeTextAttribute("hidden", "8");

export const strikethrough = makeTextAttribute("strikethrough", "9");

export const overline = makeTextAttribute("overline", "53");

export const reset = makeTextAttribute("reset", "0");

//
// --------------------------------------------------------------------------------
// --  Combine  -------------------------------------------------------------------
// --------------------------------------------------------------------------------
//

const getStyleConflictKey = (style: AnsiAttribute): string => {
  switch (style._tag) {
    case "ForegroundColor":
    case "BackgroundColor":
      return style._tag; // Only one of each color type is allowed
    default:
      return style.name; // Other attributes are unique by name
  }
};

/**
 * Combines multiple ANSI style annotations into a single array of AnsiStyleType,
 * resolving conflicts with a last-wins strategy.
 *
 * @param annotations - An array of AnsiAnnotation to combine.
 * @returns A new AnsiAnnotation containing an array of resolved AnsiStyleType.
 */
export function combine(...annotations: AnsiAnnotation[]): AnsiAnnotation {
  const resolvedStyles = pipe(
    annotations,
    Array.flatMap((d) => d.data),
    Array.reverse,
    Array.reduce(new Map<string, AnsiAttribute>(), (acc, style) => {
      const key = getStyleConflictKey(style);
      if (!acc.has(key)) {
        acc.set(key, style);
      }
      return acc;
    }),
    (map) => Array.fromIterable(map.values()),
    Array.reverse
  );

  return createAnnotation(resolvedStyles);
}

/*
 *  --------------------------------------------------------------------------------
 *  --  Rendering  -----------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Type guard to check if annotation data is an ANSI style
 */
const isAnsiStyle = (data: unknown): data is AnsiStyle => {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "_tag" in item &&
        "name" in item &&
        "code" in item
    )
  );
};

const isCommandAnnotation = (data: unknown): data is AnsiStyle => {
  return (
    isAnsiStyle(data) &&
    data.length === 1 &&
    data[0]?._tag === "CommandAttribute"
  );
};

/**
 * Extracts ANSI escape sequence from annotation data if it's ANSI-related
 * Styled sequences (colors, text effects) join codes with ';' and end with 'm'
 * Command sequences (cursor movement, erase) use their specific format
 */
export const getAnsiEscapeSequence = (data: AnsiStyle): string | null => {
  if (data.length === 0) {
    return null;
  }
  return pipe(
    Array.partition(data, (attr) => attr._tag === "CommandAttribute"),
    ([styleAttr, cmdAttr]) => {
      const styleCode =
        styleAttr.length > 0
          ? styleAttr.map((style) => style.code).join(";")
          : null;
      const cmdCode =
        cmdAttr.length > 0 ? cmdAttr.map((cmd) => cmd.code).join("") : null;

      return (
        `${styleCode ? `${CSI}${styleCode}m` : ""}${cmdCode ?? ""}`.trim() ||
        null
      );
    }
  );
};

/**
 * Applies ANSI styling to content lines using a functional approach with Effect's Option and pipe
 * @param lines - The array of strings to style
 * @param escapeSequence - The ANSI escape sequence to apply
 */
const applyAnsiStyling = (lines: string[], escapeSequence: string): string[] =>
  pipe(
    Option.fromNullable(escapeSequence),
    Option.filter((seq) => seq !== ""),
    Option.match({
      onNone: () => lines,
      onSome: (sequence) =>
        Array.map(lines, (line) => {
          if (line.startsWith(sequence)) {
            return line;
          }

          if (line.includes(RESET)) {
            const injected = line.split(RESET).join(`${RESET}${sequence}`);
            const withPrefix = `${sequence}${injected}`;
            return withPrefix.endsWith(RESET)
              ? withPrefix
              : `${withPrefix}${RESET}`;
          }

          return `${sequence}${line}${RESET}`;
        }),
    })
  );

const DEC_SEQUENCE = /[78]/;
const ESC_END = /[a-zA-Z]/;

/**
 * Finds the end of an ANSI escape sequence starting from a given position
 */
const findAnsiSequenceEnd = (
  chars: readonly string[],
  startIndex: number
): number => {
  // Handle DEC sequences (ESC 7, ESC 8, etc.) - only 2 characters
  if (chars[startIndex + 1] && DEC_SEQUENCE.test(chars[startIndex + 1] || "")) {
    return startIndex + 2;
  }

  // Handle CSI sequences (ESC [ ... letter)
  if (chars[startIndex + 1] === "[") {
    return pipe(
      Array.drop(chars, startIndex + 2),
      Array.findFirstIndex((char: string) => ESC_END.test(char)),
      Option.map((endPos: number) => startIndex + 2 + endPos + 1),
      Option.getOrElse(() => chars.length)
    );
  }

  return chars.length;
};

/**
 * Truncates a string to a visible length while preserving ANSI escape sequences
 */
const truncatePreservingAnsi = (
  str: string,
  maxVisibleLength: number
): string => {
  if (Width.ofString(str) <= maxVisibleLength) {
    return str;
  }

  // Use grapheme segmentation for proper emoji handling
  const segments = Array.fromIterable(segmenter.segment(str)).map(
    ({ segment }) => segment
  );

  return pipe(
    segments,
    Array.reduce(
      { result: "", visibleCount: 0, skipNext: 0 },
      ({ result, skipNext, visibleCount }, cur, index) => {
        if (skipNext > 0) {
          return { result, visibleCount, skipNext: skipNext - 1 };
        }
        if (visibleCount >= maxVisibleLength) {
          return { result, visibleCount, skipNext };
        }
        if (cur === `${ESC}` && segments[index + 1] === "[") {
          const sequenceEnd = findAnsiSequenceEnd(segments, index);
          return {
            visibleCount,
            result: result + segments.slice(index, sequenceEnd).join(""),
            skipNext: sequenceEnd - index - 1,
          };
        }
        return {
          skipNext,
          result: result + cur,
          visibleCount: visibleCount + 1,
        };
      }
    ),
    (d) => d.result
  );
};

/**
 * Pads a string to a visible length while preserving ANSI escape sequences
 */
const padPreservingAnsi = (
  str: string,
  targetVisibleLength: number,
  alignment: Alignment = "AlignFirst"
): string => {
  const currentVisibleLength = Width.ofString(str);
  if (currentVisibleLength >= targetVisibleLength) {
    return truncatePreservingAnsi(str, targetVisibleLength);
  }

  // Use grapheme segmentation for proper emoji handling
  const segments = Array.fromIterable(segmenter.segment(str)).map(
    ({ segment }) => segment
  );

  return takePA(
    segments,
    alignment,
    " ",
    segments.length + targetVisibleLength - currentVisibleLength
  ).join("");
};

/**
 * ANSI-aware version of resizeBox for emojis that preserves zero-width joiners
 */
const resizeBox = dual<
  (r: number, c: number) => (self: string[]) => string[],
  (self: string[], r: number, c: number) => string[]
>(3, (self, r, c) =>
  takeP(
    self.map((line) =>
      Width.ofString(line) <= c ? line : truncatePreservingAnsi(line, c)
    ),
    blanks(c),
    r
  )
);

/**
 * ANSI-aware version of resizeBox with alignment for emojis that preserves zero-width joiners
 */
const resizeBoxAligned =
  (r: number, c: number, ha: Alignment, va: Alignment) => (self: string[]) =>
    takePA(
      self.map((line) => padPreservingAnsi(line, c, ha)),
      va,
      blanks(c),
      r
    );

/**
 * Converts a box into an array of text lines for display with ANSI annotation support.
 * @param self - The box to render as text lines
 *
 * @note Haskell: `renderBox :: Box -> [String]`
 */
export const renderAnnotatedBox = <A>({
  cols,
  content,
  rows,
  annotation,
}: Box<A>): string[] => {
  // Special case: null boxes with CMD annotations should render their escape sequences
  if (
    (rows === 0 || cols === 0) &&
    annotation &&
    isCommandAnnotation(annotation.data)
  ) {
    const seq = getAnsiEscapeSequence(annotation.data);
    return seq ? [seq] : [];
  }

  if (rows === 0 || cols === 0) {
    return [];
  }

  const contentLines = pipe(
    content,
    Match.type<Content<A>>().pipe(
      Match.tag("Blank", () => resizeBox([""], rows, cols)),
      Match.tag("Text", ({ text }) => resizeBox([text], rows, cols)),
      Match.tag("Row", ({ boxes }) =>
        pipe(Array.map(boxes, renderAnnotatedBox), merge, resizeBox(rows, cols))
      ),
      Match.tag("Col", ({ boxes }) =>
        pipe(Array.flatMap(boxes, renderAnnotatedBox), resizeBox(rows, cols))
      ),
      Match.tag("SubBox", ({ box, xAlign, yAlign }) =>
        pipe(
          renderAnnotatedBox(box),
          resizeBoxAligned(rows, cols, xAlign, yAlign)
        )
      ),
      Match.exhaustive
    )
  );

  if (annotation && isAnsiStyle(annotation.data)) {
    const escapeSequence = getAnsiEscapeSequence(annotation.data);
    if (escapeSequence) {
      return applyAnsiStyling(contentLines, escapeSequence);
    }
  }

  return contentLines;
};
