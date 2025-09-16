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
const CSI = `${ESC}[`;
const RESET = `${CSI}0m`;

/**
 * ANSI text attribute definitions
 *
 */
export type AnsiAttribute = {
  readonly name: string;
  readonly code: string;
};

/**
 * Discriminated union for all ANSI styling options
 */
export type AnsiStyleType = {
  readonly _tag:
    | "ForegroundColor"
    | "BackgroundColor"
    | "TextAttribute"
    | "CommandAttribute";
  readonly attribute: {
    readonly name: string;
    readonly code: string;
  };
};

export type AnsiStyle = AnsiStyleType | readonly AnsiStyleType[];
/**
 * ANSI annotation type that wraps ANSI styles in the Annotation system
 */
export type AnsiAnnotation = Annotation<AnsiStyle>;

/**
 * Gets a conflict key for an ANSI style to resolve duplicates.
 * Foreground and background colors conflict with each other.
 * Text attributes are unique.
 *
 * @param style - The ANSI style to get a key for.
 */
const getStyleConflictKey = (style: AnsiStyleType): string => {
  switch (style._tag) {
    case "ForegroundColor":
    case "BackgroundColor":
      return style._tag; // Only one of each color type is allowed
    default:
      return style.attribute.name; // Other attributes are unique by name
  }
};

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
  attribute: { name: "black", code: "30" },
});
export const red = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "red", code: "31" },
});
export const green = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "green", code: "32" },
});
export const yellow = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "yellow", code: "33" },
});
export const blue = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "blue", code: "34" },
});
export const magenta = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "magenta", code: "35" },
});
export const cyan = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "cyan", code: "36" },
});
export const white = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "white", code: "37" },
});
export const defaultColor = createAnnotation<AnsiStyleType>({
  _tag: "ForegroundColor",
  attribute: { name: "default", code: "39" },
});
const clampColor = (n: number): number => Math.min(255, Math.max(0, n));

export const color256 = (n: number): AnsiAnnotation => {
  return createAnnotation<AnsiStyleType>({
    _tag: "ForegroundColor",
    attribute: {
      name: `color256(${clampColor(n) + 1})`,
      code: `38;5;${clampColor(n)}`,
    },
  });
};

export const colorRGB = (r: number, g: number, b: number): AnsiAnnotation =>
  createAnnotation<AnsiStyleType>({
    _tag: "ForegroundColor",
    attribute: {
      name: `rgb(${clampColor(r)},${clampColor(g)},${clampColor(b)})`,
      code: `38;2;${clampColor(r)};${clampColor(g)};${clampColor(b)}`,
    },
  });

/**
 * Background color constants - aliases to the main color constants
 * Provided for API convenience and consistency with other ANSI libraries
 */
export const bgBlack = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "black", code: "40" },
});
export const bgRed = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "red", code: "41" },
});
export const bgGreen = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "green", code: "42" },
});
export const bgYellow = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "yellow", code: "43" },
});
export const bgBlue = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "blue", code: "44" },
});
export const bgMagenta = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "magenta", code: "45" },
});
export const bgCyan = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "cyan", code: "46" },
});
export const bgWhite = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "white", code: "47" },
});
export const bgDefault = createAnnotation<AnsiStyleType>({
  _tag: "BackgroundColor",
  attribute: { name: "default", code: "49" },
});

export const bgColor256 = (n: number): AnsiAnnotation =>
  createAnnotation<AnsiStyleType>({
    _tag: "BackgroundColor",
    attribute: {
      name: `color256(${n})`,
      code: `48;5;${clampColor(n)}`,
    },
  });

export const bgColorRGB = (r: number, g: number, b: number): AnsiAnnotation =>
  createAnnotation<AnsiStyleType>({
    _tag: "BackgroundColor",
    attribute: {
      name: `rgb(${clampColor(r)},${clampColor(g)},${clampColor(b)})`,
      code: `48;2;${clampColor(r)};${clampColor(g)};${clampColor(b)}`,
    },
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
  attribute: { name: "bold", code: "1" },
});
export const dim = createAnnotation<AnsiStyleType>({
  _tag: "TextAttribute",
  attribute: { name: "dim", code: "2" },
});
export const italic = createAnnotation<AnsiStyleType>({
  _tag: "TextAttribute",
  attribute: { name: "italic", code: "3" },
});
export const underlined = createAnnotation<AnsiStyleType>({
  _tag: "TextAttribute",
  attribute: { name: "underlined", code: "4" },
});
export const blink = createAnnotation<AnsiStyleType>({
  _tag: "TextAttribute",
  attribute: { name: "blink", code: "5" },
});
export const inverse = createAnnotation<AnsiStyleType>({
  _tag: "TextAttribute",
  attribute: { name: "inverse", code: "7" },
});
export const hidden = createAnnotation<AnsiStyleType>({
  _tag: "TextAttribute",
  attribute: { name: "hidden", code: "8" },
});
export const strikethrough = createAnnotation<AnsiStyleType>({
  _tag: "TextAttribute",
  attribute: { name: "strikethrough", code: "9" },
});
export const overline = createAnnotation<AnsiStyleType>({
  _tag: "TextAttribute",
  attribute: { name: "overline", code: "53" },
});
export const reset = createAnnotation<AnsiStyleType>({
  _tag: "TextAttribute",
  attribute: { name: "reset", code: "0" },
});

/*
 *  --------------------------------------------------------------------------------
 *  --  Combine  -------------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Combines multiple ANSI style annotations into a single array of AnsiStyleType,
 * resolving conflicts with a last-wins strategy.
 *
 * @param annotations - An array of AnsiAnnotation to combine.
 * @returns A new AnsiAnnotation containing an array of resolved AnsiStyleType.
 */
export function combine(...annotations: AnsiAnnotation[]): AnsiAnnotation {
  const styles = pipe(
    annotations,
    Array.flatMap((a) => (Array.isArray(a.data) ? a.data : [a.data]))
  );

  const resolvedStyles = pipe(
    styles as AnsiStyleType[],
    Array.reverse,
    Array.reduce(new Map<string, AnsiStyleType>(), (acc, style) => {
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
    [
      "ForegroundColor",
      "BackgroundColor",
      "TextAttribute",
      "CommandAttribute",
    ].includes(obj._tag)
  );
};

/**
 * Type guard to check if annotation data is a combined ANSI style
 */
const isCombinedAnsiStyle = (
  data: unknown
): data is readonly AnsiStyleType[] => {
  return Array.isArray(data) && data.every(isAnsiStyleType);
};

const isCommandAnnotation = (
  data: unknown
): data is AnsiStyleType | readonly AnsiStyleType[] => {
  if (isAnsiStyleType(data)) {
    return data._tag === "CommandAttribute";
  }
  if (isCombinedAnsiStyle(data)) {
    return data.some((d) => d._tag === "CommandAttribute");
  }
  return false;
};

/**
 * Extracts ANSI escape sequence from annotation data if it's ANSI-related
 */
const getAnsiEscapeSequence = (data: unknown): string | null => {
  if (isAnsiStyleType(data)) {
    if (data._tag === "CommandAttribute") {
      return data.attribute.code;
    }
    return `${CSI}${data.attribute.code}m`;
  }
  if (isCombinedAnsiStyle(data)) {
    const codes = data.flatMap((style) => style.attribute.code);
    return codes.length > 0 ? `${CSI}${codes.join(";")}m` : "";
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

/**
 * Calculates the visible (printable) length of a string, ignoring ANSI escape sequences
 */
const getVisibleLength = (str: string): number => {
  // Match various ANSI escape sequences:
  // - CSI sequences: \u001B[...m (SGR codes for colors/styles)
  // - CSI sequences: \u001B[...H, \u001B[...A, etc. (cursor movement)
  // - DEC sequences: \u001B7, \u001B8 (save/restore cursor)
  const ansiRegex = new RegExp(`${ESC}\\[[0-9;]*[a-zA-Z]|${ESC}[78]`, "g");
  return str.replace(ansiRegex, "").length;
};

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
        if (cur === `${ESC}` && str.split("")[index + 1] === "[") {
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
        pipe(
          Array.map(boxes, renderAnnotatedBox),
          merge,
          resizeBoxAnsiAware(rows, cols)
        )
      ),
      Match.tag("Col", ({ boxes }) =>
        pipe(
          Array.flatMap(boxes, renderAnnotatedBox),
          resizeBoxAnsiAware(rows, cols)
        )
      ),
      Match.tag("SubBox", ({ box, xAlign, yAlign }) =>
        pipe(
          renderAnnotatedBox(box),
          resizeBoxAnsiAwareAligned(rows, cols, xAlign, yAlign)
        )
      ),
      Match.exhaustive
    )
  );

  if (annotation) {
    const escapeSequence = getAnsiEscapeSequence(annotation.data);
    if (escapeSequence) {
      return applyAnsiStyling(contentLines, escapeSequence);
    }
  }

  return contentLines;
};
