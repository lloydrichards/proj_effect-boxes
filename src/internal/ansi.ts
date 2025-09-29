import { Array, Option, pipe } from "effect";
import { dual } from "effect/Function";
import type * as Ansi from "../Ansi";
import type * as Box from "../Box";
import { createAnnotation } from "./annotation";
import { blanks, make, match, merge, takeP, takePA } from "./box";
import * as Width from "./width";

// ANSI escape sequence constants
const ESC = "\x1b";
const CSI = `${ESC}[`;
const RESET = `${CSI}0m`;

const makeForegroundColor = (name: string, code: string): Ansi.AnsiAnnotation =>
  createAnnotation<Ansi.AnsiStyle>([
    {
      _tag: "ForegroundColor",
      name,
      code,
    },
  ]);

const makeBackgroundColor = (name: string, code: string): Ansi.AnsiAnnotation =>
  createAnnotation<Ansi.AnsiStyle>([
    {
      _tag: "BackgroundColor",
      name,
      code,
    },
  ]);

const makeTextAttribute = (name: string, code: string): Ansi.AnsiAnnotation =>
  createAnnotation<Ansi.AnsiStyle>([
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
export const color256 = (n: number): Ansi.AnsiAnnotation =>
  makeForegroundColor(`color256(${clampColor(n)})`, `38;5;${clampColor(n)}`);
export const colorRGB = (
  r: number,
  g: number,
  b: number
): Ansi.AnsiAnnotation =>
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
export const bgColor256 = (n: number): Ansi.AnsiAnnotation =>
  makeBackgroundColor(`color256(${clampColor(n)})`, `48;5;${clampColor(n)}`);
export const bgColorRGB = (
  r: number,
  g: number,
  b: number
): Ansi.AnsiAnnotation =>
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

const getStyleConflictKey = (style: Ansi.AnsiAttribute): string => {
  switch (style._tag) {
    case "ForegroundColor":
    case "BackgroundColor":
      return style._tag; // Only one of each color type is allowed
    default:
      return style.name; // Other attributes are unique by name
  }
};

/**
 * Combines multiple ANSI style annotations into a single array of Ansi.AnsiStyleType,
 * resolving conflicts with a last-wins strategy.
 *
 * @param annotations - An array of Ansi.AnsiAnnotation to combine.
 * @returns A new Ansi.AnsiAnnotation containing an array of resolved Ansi.AnsiStyleType.
 */
export const combine = (
  ...annotations: Ansi.AnsiAnnotation[]
): Ansi.AnsiAnnotation => {
  const resolvedStyles = pipe(
    annotations,
    Array.flatMap((d) => d.data),
    Array.reverse,
    Array.reduce(new Map<string, Ansi.AnsiAttribute>(), (acc, style) => {
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
};

/*
 *  --------------------------------------------------------------------------------
 *  --  Rendering  -----------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */
/** @internal */
export const isAnsi = (data: unknown): data is Ansi.AnsiStyle =>
  Array.isArray(data) &&
  data.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "_tag" in item &&
      "name" in item &&
      "code" in item
  );

/** @internal */
export const isCommandAnnotation = (data: unknown): data is Ansi.AnsiStyle =>
  isAnsi(data) && data.length === 1 && data[0]?._tag === "CommandAttribute";

/** @internal */
export const getAnsiEscapeSequence = (data: Ansi.AnsiStyle): string | null => {
  if (data.length === 0) {
    return null;
  }

  // Optimized partitioning with simple loops for better performance
  const styleCodes: string[] = [];
  const cmdCodes: string[] = [];

  for (const attr of data) {
    if (attr._tag === "CommandAttribute") {
      cmdCodes.push(attr.code);
    } else {
      styleCodes.push(attr.code);
    }
  }

  const styleCode = styleCodes.length > 0 ? styleCodes.join(";") : null;
  const cmdCode = cmdCodes.length > 0 ? cmdCodes.join("") : null;

  const result =
    `${styleCode ? `${CSI}${styleCode}m` : ""}${cmdCode ?? ""}`.trim();
  return result || null;
};

/** @internal */
export const applyAnsiStyling = (
  lines: string[],
  escapeSequence: string
): string[] =>
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

// Pre-compiled regex patterns for performance
const DEC_SEQUENCE = /[78]/;
const ESC_END = /[a-zA-Z]/;

const findAnsiSequenceEnd = (
  chars: readonly string[],
  startIndex: number
): number => {
  // Handle DEC sequences (ESC 7, ESC 8, etc.) - only 2 characters
  if (chars[startIndex + 1] && DEC_SEQUENCE.test(chars[startIndex + 1] || "")) {
    return startIndex + 2;
  }

  // Handle CSI sequences (ESC [ ... letter) - optimized loop instead of Effect operations
  if (chars[startIndex + 1] === "[") {
    for (let i = startIndex + 2; i < chars.length; i++) {
      if (ESC_END.test(chars[i] || "")) {
        return i + 1;
      }
    }
    return chars.length;
  }

  return chars.length;
};

/** @internal */
export const truncatePreservingAnsi = (
  str: string,
  maxVisibleLength: number
): string => {
  if (Width.ofString(str) <= maxVisibleLength) {
    return str;
  }

  const segments = Width.segments(str);

  // Optimized imperative loop for better performance in hot path
  let result = "";
  let visibleCount = 0;
  let skipNext = 0;

  for (let index = 0; index < segments.length; index++) {
    if (skipNext > 0) {
      skipNext--;
      continue;
    }
    if (visibleCount >= maxVisibleLength) {
      break;
    }

    const cur = segments[index];

    if (cur === ESC && segments[index + 1] === "[") {
      const sequenceEnd = findAnsiSequenceEnd(segments, index);
      // Batch append ANSI sequence for efficiency
      const sequenceParts: string[] = [];
      for (let i = index; i < sequenceEnd; i++) {
        sequenceParts.push(segments[i] || "");
      }
      result += sequenceParts.join("");
      skipNext = sequenceEnd - index - 1;
    } else {
      result += cur;
      visibleCount++;
    }
  }

  return result;
};
/** @internal */
export const padPreservingAnsi = (
  str: string,
  targetVisibleLength: number,
  alignment: Box.Alignment = "AlignFirst"
): string => {
  const currentVisibleLength = Width.ofString(str);
  if (currentVisibleLength >= targetVisibleLength) {
    return truncatePreservingAnsi(str, targetVisibleLength);
  }

  // Fast path for simple cases without ANSI sequences
  if (!str.includes(ESC)) {
    const padding = " ".repeat(targetVisibleLength - currentVisibleLength);
    switch (alignment) {
      case "AlignFirst":
        return str + padding;
      case "AlignLast":
        return padding + str;
      case "AlignCenter1":
      case "AlignCenter2": {
        const leftPad = Math.floor(
          (targetVisibleLength - currentVisibleLength) / 2
        );
        const rightPad = targetVisibleLength - currentVisibleLength - leftPad;
        return " ".repeat(leftPad) + str + " ".repeat(rightPad);
      }
    }
  }

  // Use grapheme segmentation for proper emoji handling (complex case with ANSI)
  const segments = Width.segments(str);

  return takePA(
    segments,
    alignment,
    " ",
    segments.length + targetVisibleLength - currentVisibleLength
  ).join("");
};

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

const resizeBoxAligned =
  (r: number, c: number, ha: Box.Alignment, va: Box.Alignment) =>
  (self: string[]) =>
    takePA(
      self.map((line) => padPreservingAnsi(line, c, ha)),
      va,
      blanks(c),
      r
    );

/** @internal */
export const renderAnnotatedBox = <A>({
  cols,
  content,
  rows,
  annotation,
}: Box.Box<A>): string[] => {
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

  const contentLines = match(make({ cols, content, rows, annotation }), {
    blank: () => resizeBox([""], rows, cols),
    text: (text) => resizeBox([text], rows, cols),
    row: (boxes) =>
      pipe(Array.map(boxes, renderAnnotatedBox), merge, resizeBox(rows, cols)),
    col: (boxes) =>
      pipe(Array.flatMap(boxes, renderAnnotatedBox), resizeBox(rows, cols)),
    subBox: (box, xAlign, yAlign) =>
      pipe(
        renderAnnotatedBox(box),
        resizeBoxAligned(rows, cols, xAlign, yAlign)
      ),
  });

  if (annotation && isAnsi(annotation.data)) {
    const escapeSequence = getAnsiEscapeSequence(annotation.data);
    if (escapeSequence) {
      return applyAnsiStyling(contentLines, escapeSequence);
    }
  }

  return contentLines;
};
