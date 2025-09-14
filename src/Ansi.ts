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
  resizeBox,
  takeP,
  takePA,
} from "./Box";

const ESC = "\x1b";
/**
 * ANSI text attribute definitions
 *
 */
export interface AnsiAttribute {
  readonly name: string;
  readonly code: number;
}

/**
 * Discriminated union for all ANSI styling options
 */
export type AnsiStyleType = {
  readonly _tag: "ForegroundColor" | "BackgroundColor" | "TextAttribute";
  readonly attribute: AnsiAttribute;
};

/**
 * Combined ANSI style representation
 */
export interface CombinedAnsiStyle {
  readonly styles: readonly AnsiStyleType[];
  readonly escapeSequence: string;
}

/**
 * Creates a conflict resolution key for ANSI style types
 */
const getStyleConflictKey = (style: AnsiStyleType): string => {
  switch (style._tag) {
    case "ForegroundColor":
      return "ForegroundColor";
    case "BackgroundColor":
      return "BackgroundColor";
    case "TextAttribute":
      return `TextAttribute:${style.attribute.name}`;
  }
};

/**
 * Creates a CombinedAnsiStyle from multiple style inputs
 * Handles conflict resolution (last-wins for same style types)
 * and generates the appropriate escape sequence
 */
const createCombinedAnsiStyle = (
  ...styles: AnsiStyleType[]
): CombinedAnsiStyle => {
  const resolvedStyles = pipe(
    styles,
    Array.reverse,
    Array.reduce(new Map<string, AnsiStyleType>(), (styleMap, style) => {
      if (!styleMap.has(getStyleConflictKey(style))) {
        styleMap.set(getStyleConflictKey(style), style);
      }
      return styleMap;
    }),
    (styleMap) => Array.fromIterable(styleMap.values()),
    Array.reverse
  );
  const escapeSequence = pipe(
    resolvedStyles,
    Array.map((style: AnsiStyleType): number => style.attribute.code),
    (codes) => (codes.length > 0 ? `${ESC}[${codes.join(";")}m` : "")
  );
  return { styles: resolvedStyles, escapeSequence };
};

/**
 * ANSI annotation type that wraps ANSI styles in the Annotation system
 */
export type AnsiAnnotation = Annotation<AnsiStyleType>;

/**
 * Combined ANSI annotation type for multiple styles
 */
export type CombinedAnsiAnnotation = Annotation<CombinedAnsiStyle>;

/*
 *  --------------------------------------------------------------------------------
 *  --  ANSI Color Constants  ------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Standard ANSI colors - basic 8-color palette
 * Each color has both foreground and background codes
 */
export const black = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "black", code: 30 },
});
export const red = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "red", code: 31 },
});
export const green = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "green", code: 32 },
});
export const yellow = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "yellow", code: 33 },
});
export const blue = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "blue", code: 34 },
});
export const magenta = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "magenta", code: 35 },
});
export const cyan = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "cyan", code: 36 },
});
export const white = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "white", code: 37 },
});

/**
 * Background color constants - aliases to the main color constants
 * Provided for API convenience and consistency with other ANSI libraries
 */
export const bgBlack = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "black", code: 40 },
});
export const bgRed = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "red", code: 41 },
});
export const bgGreen = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "green", code: 42 },
});
export const bgYellow = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "yellow", code: 43 },
});
export const bgBlue = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "blue", code: 44 },
});
export const bgMagenta = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "magenta", code: 45 },
});
export const bgCyan = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "cyan", code: 46 },
});
export const bgWhite = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "white", code: 47 },
});

/*
 *  --------------------------------------------------------------------------------
 *  --  Standard ANSI text attributes  ---------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Standard ANSI text formatting attributes
 */
export const bold = createAnnotation<AnsiStyleType>({
  _tag: "TextAttribute",
  attribute: { name: "bold", code: 1 },
});
export const underlined = createAnnotation<AnsiStyleType>({
  _tag: "TextAttribute",
  attribute: { name: "underlined", code: 4 },
});
export const reset = createAnnotation<AnsiStyleType>({
  _tag: "TextAttribute",
  attribute: { name: "reset", code: 0 },
});

/*
 *  --------------------------------------------------------------------------------
 *  --  Combine  -------------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Combines multiple ANSI style annotations into a single CombinedAnsiStyle annotation
 * Supports both variadic arguments and array input
 * @param annotations - Multiple AnsiAnnotation arguments or single array
 */
export function combine(
  ...annotations: AnsiAnnotation[]
): CombinedAnsiAnnotation {
  const combinedStyle = createCombinedAnsiStyle(
    ...annotations.map((annotation) => annotation.data)
  );

  return createAnnotation(combinedStyle);
}

/**
 * Converts a CombinedAnsiStyle to its ANSI escape sequence string
 * @param style - The CombinedAnsiStyle to convert
 */
export const toEscapeSequence = (style: CombinedAnsiStyle): string => {
  return style.escapeSequence;
};

/*
 *  --------------------------------------------------------------------------------
 *  --  Rendering  -----------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Type guard to check if annotation data is an ANSI style type
 */
const isAnsiStyleType = (data: unknown): data is AnsiStyleType => {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;
  return (
    "_tag" in obj &&
    "attribute" in obj &&
    typeof obj._tag === "string" &&
    ["ForegroundColor", "BackgroundColor", "TextAttribute"].includes(obj._tag)
  );
};

/**
 * Type guard to check if annotation data is a combined ANSI style
 */
const isCombinedAnsiStyle = (data: unknown): data is CombinedAnsiStyle => {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;
  return (
    "styles" in obj &&
    "escapeSequence" in obj &&
    Array.isArray(obj.styles) &&
    typeof obj.escapeSequence === "string"
  );
};

/**
 * Extracts ANSI escape sequence from annotation data if it's ANSI-related
 */
const getAnsiEscapeSequence = (data: unknown): string | null => {
  if (isAnsiStyleType(data)) {
    const combined = createCombinedAnsiStyle(data);
    return combined.escapeSequence;
  }
  if (isCombinedAnsiStyle(data)) {
    return data.escapeSequence;
  }
  return null;
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
      onSome: (sequence) => {
        return Array.map(lines, (line) => {
          if (line.startsWith(sequence)) {
            return line;
          }

          if (line.includes(`${ESC}[0m`)) {
            const restoredLine = line.replace(
              /\x1b\[0m/g,
              `${ESC}[0m${sequence}`
            );
            return `${sequence}${restoredLine}${ESC}[0m`;
          }

          return `${sequence}${line}${ESC}[0m`;
        });
      },
    })
  );

/**
 * Calculates the visible (printable) length of a string, ignoring ANSI escape sequences
 */
const getVisibleLength = (str: string): number => {
  const ansiRegex = new RegExp(`${ESC}\\[[0-9;]*m`, "g");
  return str.replace(ansiRegex, "").length;
};

/**
 * Finds the end of an ANSI escape sequence starting from a given position
 */
const findAnsiSequenceEnd = (
  chars: readonly string[],
  startIndex: number
): number =>
  pipe(
    Array.drop(chars, startIndex + 2),
    Array.findFirstIndex((char: string) => char === "m"),
    Option.map((endPos: number) => startIndex + 2 + endPos + 1),
    Option.getOrElse(() => chars.length)
  );

/**
 * Truncates a string to a visible length while preserving ANSI escape sequences
 */
const truncatePreservingAnsi = (
  str: string,
  maxVisibleLength: number
): string => {
  if (getVisibleLength(str) <= maxVisibleLength) {
    return str;
  }

  return pipe(
    str.split(""),
    Array.reduce(
      { result: "", visibleCount: 0, skipNext: 0 },
      ({ result, skipNext, visibleCount }, cur, index) => {
        if (skipNext > 0) {
          return { result, visibleCount, skipNext: skipNext - 1 };
        }
        if (visibleCount >= maxVisibleLength) {
          return { result, visibleCount, skipNext };
        }
        if (cur === "${ESC}" && str.split("")[index + 1] === "[") {
          const sequenceEnd = findAnsiSequenceEnd(str.split(""), index);
          return {
            visibleCount,
            result: result + str.split("").slice(index, sequenceEnd).join(""),
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
  const currentVisibleLength = getVisibleLength(str);
  if (currentVisibleLength >= targetVisibleLength) {
    return truncatePreservingAnsi(str, targetVisibleLength);
  }

  return takePA(
    str.split(""),
    alignment,
    " ",
    str.split("").length + targetVisibleLength - currentVisibleLength
  ).join("");
};

/**
 * ANSI-aware version of resizeBox that properly handles escape sequences
 */
const resizeBoxAnsiAware =
  (r: number, c: number) =>
  (self: string[]): string[] =>
    takeP(
      self.map((line) => padPreservingAnsi(line, c)),
      blanks(c),
      r
    );

export const resizeBoxAnsiAwareAligned = dual<
  (
    r: number,
    c: number,
    ha: Alignment,
    va: Alignment
  ) => (self: string[]) => string[],
  (
    self: string[],
    r: number,
    c: number,
    ha: Alignment,
    va: Alignment
  ) => string[]
>(5, (self, r, c, ha, va) =>
  takePA(
    self.map((line) => padPreservingAnsi(line, c, ha)),
    va,
    blanks(c),
    r
  )
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
  if (rows === 0 || cols === 0) {
    return [];
  }

  const renderContent = (): string[] => {
    return pipe(
      content,
      Match.type<Content<A>>().pipe(
        Match.tag("Blank", () => resizeBox([""], rows, cols)),
        Match.tag("Text", ({ text }) => resizeBox([text], rows, cols)),
        Match.tag("Row", ({ boxes }) =>
          pipe(
            boxes,
            Array.map(renderAnnotatedBoxWithRows(rows)),
            merge,
            resizeBoxAnsiAware(rows, cols)
          )
        ),
        Match.tag("Col", ({ boxes }) =>
          pipe(
            boxes,
            Array.flatMap(renderAnnotatedBoxWithCols(cols)),
            resizeBoxAnsiAware(rows, cols)
          )
        ),
        Match.tag("SubBox", ({ box, xAlign, yAlign }) =>
          pipe(
            box,
            renderAnnotatedBox,
            resizeBoxAnsiAwareAligned(rows, cols, xAlign, yAlign)
          )
        ),
        Match.exhaustive
      )
    );
  };

  const contentLines = renderContent();

  if (annotation) {
    const escapeSequence = getAnsiEscapeSequence(annotation.data);
    if (escapeSequence) {
      return applyAnsiStyling(contentLines, escapeSequence);
    }
  }

  return contentLines;
};

/**
 * Renders a box with a specific number of rows (with ANSI styling).
 */
const renderAnnotatedBoxWithRows = dual<
  <A>(r: number) => (self: Box<A>) => string[],
  <A>(self: Box<A>, r: number) => string[]
>(2, (self, r) => renderAnnotatedBox({ ...self, rows: r }));

/**
 * Renders a box with a specific number of columns (with ANSI styling).
 */
const renderAnnotatedBoxWithCols = dual<
  <A>(c: number) => (self: Box<A>) => string[],
  <A>(self: Box<A>, c: number) => string[]
>(2, (self, c) => renderAnnotatedBox({ ...self, cols: c }));
