import { Array, Match, pipe } from "effect";
import { dual } from "effect/Function";
import type { Annotation } from "./Annotation";
import { createAnnotation } from "./Annotation";
import {
  type Alignment,
  type Box,
  type Content,
  merge,
  resizeBox,
} from "./Box";

/**
 * ANSI text attribute definitions
 *
 * Represents text formatting attributes like bold, underline, etc.
 * Standard ANSI codes: bold=1, underline=4, reset=0
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
 *
 * Represents multiple ANSI styles merged into a single object with
 * conflict resolution and escape sequence generation.
 */
export interface CombinedAnsiStyle {
  readonly styles: readonly AnsiStyleType[];
  readonly escapeSequence: string;
}

/**
 * Creates a CombinedAnsiStyle from multiple style inputs
 * Handles conflict resolution (last-wins for same style types)
 * and generates the appropriate escape sequence
 */
const createCombinedAnsiStyle = (
  ...styles: AnsiStyleType[]
): CombinedAnsiStyle => {
  // Handle conflict resolution - last wins for same style types
  const resolvedStyles: AnsiStyleType[] = [];
  const seen = new Set<string>();

  // Process styles in reverse order to implement last-wins
  for (let i = styles.length - 1; i >= 0; i--) {
    const style = styles[i];
    if (style) {
      // Create more specific keys for conflict detection
      let key: string;
      switch (style._tag) {
        case "ForegroundColor":
          key = "ForegroundColor"; // All foreground colors conflict with each other
          break;
        case "BackgroundColor":
          key = "BackgroundColor"; // All background colors conflict with each other
          break;
        case "TextAttribute":
          key = `TextAttribute:${style.attribute.name}`; // Only same attributes conflict
          break;
      }

      if (!seen.has(key)) {
        resolvedStyles.unshift(style); // Add to beginning to maintain original order
        seen.add(key);
      }
    }
  }

  // Generate escape sequence
  const codes: number[] = [];
  for (const style of resolvedStyles) {
    switch (style._tag) {
      case "ForegroundColor":
        codes.push(style.attribute.code);
        break;
      case "BackgroundColor":
        codes.push(style.attribute.code);
        break;
      case "TextAttribute":
        codes.push(style.attribute.code);
        break;
    }
  }

  const escapeSequence = codes.length > 0 ? `\x1b[${codes.join(";")}m` : "";

  return Object.freeze({
    styles: Object.freeze(resolvedStyles),
    escapeSequence,
  });
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
 *
 * @param annotations - Multiple AnsiAnnotation arguments or single array
 * @returns Annotation<CombinedAnsiStyle> with conflict resolution applied
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
 *
 * @param style - The CombinedAnsiStyle to convert
 * @returns The ANSI escape sequence string (e.g., "\x1b[31;1m")
 *
 * @example
 * ```typescript
 * const combined = combine(
 *   { _tag: "ForegroundColor", color: red },
 *   { _tag: "TextAttribute", attribute: bold }
 * );
 *
 * const sequence = toEscapeSequence(combined); // "\x1b[31;1m"
 * ```
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
 * Applies ANSI styling to content lines
 */
const applyAnsiStyling = (
  lines: string[],
  escapeSequence: string
): string[] => {
  if (escapeSequence === "" || lines.length === 0) {
    return lines;
  }
  const resetCode = "\x1b[0m";
  return lines.map((line) => `${escapeSequence}${line}${resetCode}`);
};

/**
 * Calculates the visible (printable) length of a string, ignoring ANSI escape sequences
 */
const getVisibleLength = (str: string): number => {
  const escapeChar = String.fromCharCode(27); // \x1b
  const ansiRegex = new RegExp(`${escapeChar}\\[[0-9;]*m`, "g");
  return str.replace(ansiRegex, "").length;
};

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

  let result = "";
  let visibleCount = 0;

  for (let i = 0; i < str.length; i++) {
    if (str[i] === "\x1b" && str[i + 1] === "[") {
      let j = i + 2;
      while (j < str.length && str[j] !== "m") {
        j++;
      }
      if (j < str.length) {
        j++;
        result += str.substring(i, j);
        i = j - 1;
        continue;
      }
    }

    if (visibleCount >= maxVisibleLength) {
      break;
    }

    result += str[i];
    visibleCount++;
  }

  return result;
};

/**
 * Pads a string to a visible length while preserving ANSI escape sequences
 */
const padPreservingAnsi = (
  str: string,
  targetVisibleLength: number,
  padChar = " "
): string => {
  const currentVisibleLength = getVisibleLength(str);
  if (currentVisibleLength >= targetVisibleLength) {
    return truncatePreservingAnsi(str, targetVisibleLength);
  }

  const padding = padChar.repeat(targetVisibleLength - currentVisibleLength);
  return str + padding;
};

/**
 * ANSI-aware version of resizeBox that properly handles escape sequences
 */
const resizeBoxAnsiAware =
  (r: number, c: number) =>
  (self: string[]): string[] => {
    const processedLines = self.map((line) => padPreservingAnsi(line, c, " "));

    // Handle row count
    if (processedLines.length >= r) {
      return processedLines.slice(0, r);
    }

    // Add empty lines if needed
    const blanks = " ".repeat(c);
    const emptyLines = pipe(
      Array.makeBy(r - processedLines.length, () => blanks)
    );
    return [...processedLines, ...emptyLines];
  };

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
          pipe(box, renderAnnotatedBox, (lines) =>
            ((
              self: string[],
              r: number,
              c: number,
              _ha: Alignment,
              _va: Alignment
            ): string[] => resizeBoxAnsiAware(r, c)(self))(
              lines,
              rows,
              cols,
              xAlign,
              yAlign
            )
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
