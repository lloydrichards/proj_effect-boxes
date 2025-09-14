import { Array, Console, Effect, Match, pipe, String } from "effect";
import * as Equal from "effect/Equal";
import { dual } from "effect/Function";
import * as Hash from "effect/Hash";
import { type Pipeable, pipeArguments } from "effect/Pipeable";
import type { Annotation } from "./Annotation";
import { renderAnnotatedBox } from "./Ansi";

export const BoxTypeId: unique symbol = Symbol.for("@effect/Box");

export type BoxTypeId = typeof BoxTypeId;

/**
 * Data type for specifying the alignment of boxes.
 */
export type Alignment =
  | "AlignFirst"
  | "AlignCenter1"
  | "AlignCenter2"
  | "AlignLast";

/**
 * Align boxes along their tops.
 */
export const top: Alignment = "AlignFirst";

/**
 * Align boxes along their bottoms.
 */
export const bottom: Alignment = "AlignLast";

/**
 * Align boxes to the left.
 */
export const left: Alignment = "AlignFirst";

/**
 * Align boxes to the right.
 */
export const right: Alignment = "AlignLast";

/**
 * Align boxes centered, but biased to the left/top in case of unequal parities.
 */
export const center1: Alignment = "AlignCenter1";

/**
 * Align boxes centered, but biased to the right/bottom in case of unequal parities.
 */
export const center2: Alignment = "AlignCenter2";

/**
 * Contents of a box.
 */
type Blank = { _tag: "Blank" };
type Text = { _tag: "Text"; text: string };
type Row<A = never> = { _tag: "Row"; boxes: Box<A>[] };
type Col<A = never> = { _tag: "Col"; boxes: Box<A>[] };
type SubBox<A = never> = {
  _tag: "SubBox";
  xAlign: Alignment;
  yAlign: Alignment;
  box: Box<A>;
};

export type Content<A = never> = Blank | Text | Row<A> | Col<A> | SubBox<A>;

/**
 * The Box data type, representing a rectangular area of text with various combinators for layout and alignment.
 */
export interface Box<A = never> extends Pipeable, Equal.Equal, Hash.Hash {
  readonly [BoxTypeId]: BoxTypeId;
  readonly rows: number;
  readonly cols: number;
  readonly content: Content<A>;
  readonly annotation?: Annotation<A>;
}

const isBox = <A>(u: unknown): u is Box<A> =>
  typeof u === "object" && u != null && BoxTypeId in u;

const contentEquals = <A>(self: Content<A>, that: Content<A>): boolean => {
  if (self._tag !== that._tag) {
    return false;
  }

  return pipe(
    self,
    Match.type<Content<A>>().pipe(
      Match.tag("Blank", () => true),
      Match.tag("Text", ({ text }) => text === (that as Text).text),
      Match.tag(
        "Row",
        ({ boxes }) =>
          boxes.length === (that as Row<A>).boxes.length &&
          boxes.every((box, i) => Equal.equals(box, (that as Row<A>).boxes[i]))
      ),
      Match.tag(
        "Col",
        ({ boxes }) =>
          boxes.length === (that as Col<A>).boxes.length &&
          boxes.every((box, i) => Equal.equals(box, (that as Col<A>).boxes[i]))
      ),
      Match.tag(
        "SubBox",
        ({ box, xAlign, yAlign }) =>
          xAlign === (that as SubBox<A>).xAlign &&
          yAlign === (that as SubBox<A>).yAlign &&
          Equal.equals(box, (that as SubBox<A>).box)
      ),
      Match.exhaustive
    )
  );
};

const contentHash = <A>(content: Content<A>): number =>
  pipe(
    content,
    Match.type<Content<A>>().pipe(
      Match.tag("Blank", () => Hash.hash("Blank")),
      Match.tag("Text", ({ text }) =>
        Hash.combine(Hash.hash("Text"))(Hash.hash(text))
      ),
      Match.tag("Row", ({ boxes }) =>
        boxes.reduce(
          (acc, box) => Hash.combine(acc)(Hash.hash(box)),
          Hash.hash("Row")
        )
      ),
      Match.tag("Col", ({ boxes }) =>
        boxes.reduce(
          (acc, box) => Hash.combine(acc)(Hash.hash(box)),
          Hash.hash("Col")
        )
      ),
      Match.tag("SubBox", ({ box, xAlign, yAlign }) =>
        pipe(
          Hash.hash("SubBox"),
          Hash.combine(Hash.hash(xAlign)),
          Hash.combine(Hash.hash(yAlign)),
          Hash.combine(Hash.hash(box))
        )
      ),
      Match.exhaustive
    )
  );

const proto: Omit<Box, "rows" | "content" | "cols" | "annotation"> = {
  [BoxTypeId]: BoxTypeId,
  [Equal.symbol]<A>(this: Box<A>, that: unknown): boolean {
    return (
      isBox<A>(that) &&
      this.rows === that.rows &&
      this.cols === that.cols &&
      contentEquals(this.content, that.content) &&
      Equal.equals(this.annotation, that.annotation)
    );
  },
  [Hash.symbol]<A>(this: Box<A>) {
    return Hash.cached(
      this,
      pipe(
        Hash.hash(this.rows),
        Hash.combine(Hash.hash(this.cols)),
        Hash.combine(contentHash(this.content)),
        Hash.combine(Hash.hash(this.annotation))
      )
    );
  },
  pipe() {
    // biome-ignore lint/correctness/noUndeclaredVariables: typescript does not recognize that this is a method on Box
    return pipeArguments(this, arguments);
  },
};

export const make = <A>(b: {
  rows: number;
  cols: number;
  content: Content<A>;
  annotation?: Annotation<A>;
}): Box<A> => {
  const box = Object.create(proto);
  box.rows = Math.max(0, b.rows);
  box.cols = Math.max(0, b.cols);
  box.content = b.content;
  if (b.annotation !== undefined) {
    box.annotation = b.annotation;
  }

  return box;
};

/**
 * Creates an empty box with no content.
 *
 * @note Haskell: `nullBox :: Box`
 */
export const nullBox: Box<never> = make({
  rows: 0,
  cols: 0,
  content: { _tag: "Blank" },
});

/**
 * Creates an empty box with the specified dimensions.
 * @param rows - The number of rows for the box
 * @param cols - The number of columns for the box
 *
 * @note Haskell: `empty :: Int -> Int -> Box`
 */
export const emptyBox = (rows = 0, cols = 0): Box<never> =>
  make({
    rows,
    cols,
    content: { _tag: "Blank" },
  });

/**
 * Creates a 1x1 box containing a single character.
 * @param c - The character to place in the box (uses first character if string is longer)
 *
 * @note Haskell: `char :: Char -> Box`
 */
export const char = (c: string): Box<never> =>
  make({
    rows: 1,
    cols: 1,
    content: { _tag: "Text", text: c[0] ?? " " },
  });

/**
 * Creates a single-line box from a string without any line breaks.
 * @param t - The text string to convert to a box
 *
 * @note Haskell: `unsafeLine :: String -> Box`
 */
const unsafeLine = (t: string): Box<never> =>
  make({
    rows: 1,
    cols: t.length,
    content: { _tag: "Text", text: t },
  });

/**
 * Creates a box containing multi-line text, splitting on newlines.
 * @param s - The text string, which may contain newline characters
 *
 * @note Haskell: `text :: String -> Box`
 */
export const text = (s: string): Box<never> =>
  pipe(s, String.split("\n"), Array.map(unsafeLine), vcat(left));

/**
 * Creates a single-line box from a string, removing any line breaks.
 * @param s - The text string (line breaks will be stripped)
 *
 * @note Haskell: `line :: String -> Box`
 */
export const line = (s: string): Box<never> =>
  unsafeLine(String.replace(/\n|\r/g, "")(s));

/**
 * Creates a paragraph box with text flowed to fit within the specified width.
 * @param self - The text to flow into a paragraph
 * @param a - The alignment for the text within the box
 * @param w - The maximum width for the paragraph
 *
 * @note Haskell: `para :: Alignment -> Int -> String -> Box`
 */
export const para = dual<
  (a: Alignment, w: number) => (self: string) => Box<never>,
  (self: string, a: Alignment, w: number) => Box<never>
>(3, (self, a, w) => {
  const lines = flow(self, w);
  return mkParaBox(lines, a, lines.length);
});

/**
 * Combines two boxes horizontally using the Semigroup instance.
 * @param self - The first box
 * @param l - The second box to combine with the first
 *
 * @note Haskell: `instance Semigroup Box where l <> r = hcat top [l,r]`
 */
export const combine = dual<
  <A>(l: Box<A>) => (self: Box<A>) => Box<A>,
  <A>(self: Box<A>, l: Box<A>) => Box<A>
>(2, <A>(self: Box<A>, l: Box<A>): Box<A> => hcat([self, l], top));

export const combineMany = dual<
  <A>(start: Box<A>) => (self: Iterable<Box<A>>) => Box<A>,
  <A>(self: Iterable<Box<A>>, start: Box<A>) => Box<A>
>(
  2,
  <A>(self: Iterable<Box<A>>, start: Box<A>): Box<A> =>
    hcat([start, ...Array.fromIterable(self)], top)
);

/**
 * Combines all boxes in a collection horizontally, returning nullBox if empty.
 * @param collection - The collection of boxes to combine
 *
 * @note Haskell: `instance Monoid Box where mempty = nullBox mappend = (<>) mconcat = hcat top`
 */
export const combineAll = <A>(collection: Iterable<Box<A>>): Box<A> => {
  const boxes = Array.fromIterable(collection);
  return boxes.length === 0 ? (nullBox as Box<A>) : hcat(boxes, top);
};

/**
 * Gets the number of rows in a box.
 * @param b - The box to measure
 *
 * @note Haskell: `rows :: Box -> Int`
 */
export const rows = <A>(b: Box<A>): number => b.rows;

/**
 * Gets the number of columns in a box.
 * @param b - The box to measure
 *
 * @note Haskell: `cols :: Box -> Int`
 */
export const cols = <A>(b: Box<A>): number => b.cols;

/**
 * Calculates the sum and maximum of a list in a single pass for efficiency.
 * @param f - Function to calculate values for summing
 * @param defaultMax - Default maximum value if list is empty
 * @param g - Function to calculate values for maximum comparison
 * @param as - Array of items to process
 *
 * @note Haskell: `sumMax :: (Num n, Ord b, Foldable f) => (a -> n) -> b -> (a -> b) -> f a -> (n, b)`
 */
const sumMax = <A>(
  f: (a: A) => number,
  defaultMax: number,
  g: (a: A) => number,
  as: readonly A[]
): [number, number] => {
  let sum = 0;
  let max = defaultMax;
  for (const a of as) {
    sum += f(a);
    max = Math.max(max, g(a));
  }
  return [sum, max];
};

/**
 * Arranges boxes horizontally in a row with the specified alignment.
 * @param self - Array of boxes to arrange horizontally
 * @param a - Vertical alignment of boxes within the row
 *
 * @note Haskell: `hcat :: Foldable f => Alignment -> f Box -> Box`
 */
export const hcat = dual<
  (a: Alignment) => <A>(self: readonly Box<A>[]) => Box<A>,
  <A>(self: readonly Box<A>[], a: Alignment) => Box<A>
>(2, <A>(self: readonly Box<A>[], a: Alignment): Box<A> => {
  const [w, h] = sumMax(cols, 0, rows, self);
  return make({
    rows: h,
    cols: w,
    content: {
      _tag: "Row",
      boxes: self.map(alignVert(a, h)) as Box<A>[],
    } as Content<A>,
  });
});

/**
 * Arranges boxes vertically in a column with the specified alignment.
 * @param self - Array of boxes to arrange vertically
 * @param a - Horizontal alignment of boxes within the column
 *
 * @note Haskell: `vcat :: Foldable f => Alignment -> f Box -> Box`
 */
export const vcat = dual<
  (a: Alignment) => <A>(self: readonly Box<A>[]) => Box<A>,
  <A>(self: readonly Box<A>[], a: Alignment) => Box<A>
>(2, <A>(self: readonly Box<A>[], a: Alignment): Box<A> => {
  const [h, w] = sumMax(rows, 0, cols, self);
  return make({
    rows: h,
    cols: w,
    content: {
      _tag: "Col",
      boxes: self.map(alignHoriz(a, w)) as Box<A>[],
    } as Content<A>,
  });
});

/**
 * Places two boxes side by side horizontally.
 * @param self - The first box
 * @param l - The second box to place to the right
 *
 * @note Haskell: `instance Semigroup Box where l <> r = hcat top [l,r]`
 */
export const hAppend = dual<
  <A>(l: Box<A>) => (self: Box<A>) => Box<A>,
  <A>(self: Box<A>, l: Box<A>) => Box<A>
>(2, <A>(self: Box<A>, l: Box<A>): Box<A> => hcat([self, l], top));

/**
 * Places two boxes side by side with a single space column between them.
 * @param self - The first box
 * @param l - The second box to place to the right
 *
 * @note Haskell: `(<+>) :: Box -> Box -> Box`
 */
export const hcatWithSpace = dual<
  <A>(l: Box<A>) => (self: Box<A>) => Box<A>,
  <A>(self: Box<A>, l: Box<A>) => Box<A>
>(
  2,
  <A>(self: Box<A>, l: Box<A>): Box<A> => hcat([self, emptyBox(0, 1), l], top)
);

/**
 * Stacks two boxes vertically, one above the other.
 * @param self - The top box
 * @param t - The bottom box
 *
 * @note Haskell: `(//) :: Box -> Box -> Box`
 */
export const vAppend = dual<
  <A>(t: Box<A>) => (self: Box<A>) => Box<A>,
  <A>(self: Box<A>, t: Box<A>) => Box<A>
>(2, <A>(self: Box<A>, t: Box<A>): Box<A> => vcat([self, t], left));

/**
 * Stacks two boxes vertically with a single empty row between them.
 * @param self - The top box
 * @param t - The bottom box
 *
 * @note Haskell: `(/+/) :: Box -> Box -> Box`
 */
export const vcatWithSpace = dual<
  <A>(t: Box<A>) => (self: Box<A>) => Box<A>,
  <A>(self: Box<A>, t: Box<A>) => Box<A>
>(
  2,
  <A>(self: Box<A>, t: Box<A>): Box<A> => vcat([self, emptyBox(1, 0), t], left)
);

/**
 * Arranges boxes horizontally with a separator box placed between each pair.
 * @param self - Array of boxes to arrange
 * @param a - Vertical alignment for the arrangement
 * @param p - Separator box to place between each pair of boxes
 *
 * @note Haskell: `punctuateH :: Foldable f => Alignment -> Box -> f Box -> Box`
 */
export const punctuateH = dual<
  <A>(a: Alignment, p: Box<A>) => (self: readonly Box<A>[]) => Box<A>,
  <A>(self: readonly Box<A>[], a: Alignment, p: Box<A>) => Box<A>
>(3, <A>(self: readonly Box<A>[], a: Alignment, p: Box<A>): Box<A> => {
  if (self.length === 0) {
    return nullBox as Box<A>;
  }
  return hcat(Array.intersperse(self, p), a);
});

/**
 * Arranges boxes vertically with a separator box placed between each pair.
 * @param self - Array of boxes to arrange
 * @param a - Horizontal alignment for the arrangement
 * @param p - Separator box to place between each pair of boxes
 *
 * @note Haskell: `punctuateV :: Foldable f => Alignment -> Box -> f Box -> Box`
 */
export const punctuateV = dual<
  <A>(a: Alignment, p: Box<A>) => (self: readonly Box<A>[]) => Box<A>,
  <A>(self: readonly Box<A>[], a: Alignment, p: Box<A>) => Box<A>
>(3, <A>(self: readonly Box<A>[], a: Alignment, p: Box<A>): Box<A> => {
  if (self.length === 0) {
    return nullBox as Box<A>;
  }
  return vcat(Array.intersperse(self, p), a);
});

/**
 * Arranges boxes horizontally with the specified amount of space between each.
 * @param self - Array of boxes to arrange
 * @param sep - Number of spaces to place between boxes
 * @param a - Vertical alignment for the arrangement
 *
 * @note Haskell: `hsep :: Foldable f => Int -> Alignment -> f Box -> Box`
 */
export const hsep = dual<
  (sep: number, a: Alignment) => <A>(self: readonly Box<A>[]) => Box<A>,
  <A>(self: readonly Box<A>[], sep: number, a: Alignment) => Box<A>
>(
  3,
  <A>(self: readonly Box<A>[], sep: number, a: Alignment): Box<A> =>
    punctuateH(self, a, emptyBox(0, sep) as Box<A>)
);

/**
 * Arranges boxes vertically with the specified amount of space between each.
 * @param self - Array of boxes to arrange
 * @param sep - Number of empty rows to place between boxes
 * @param a - Horizontal alignment for the arrangement
 *
 * @note Haskell: `vsep :: Foldable f => Int -> Alignment -> f Box -> Box`
 */
export const vsep = dual<
  (sep: number, a: Alignment) => <A>(bs: readonly Box<A>[]) => Box<A>,
  <A>(self: readonly Box<A>[], sep: number, a: Alignment) => Box<A>
>(
  3,
  <A>(self: readonly Box<A>[], sep: number, a: Alignment): Box<A> =>
    punctuateV(self, a, emptyBox(sep, 0) as Box<A>)
);

/*
 *  --------------------------------------------------------------------------------
 *  --  Paragraph flowing  ---------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

// data ParaContent = Block { _fullLines :: [Line]
//                          , _lastLine  :: Line
//                          }
interface ParaContent {
  readonly fullLines: readonly (readonly string[])[];
  readonly lastLine: readonly string[];
}

// data Para = Para { _paraWidth   :: Int
//                  , _paraContent :: ParaContent
//                  }
interface Para {
  readonly width: number;
  readonly content: ParaContent;
}

/**
 * Creates an empty paragraph structure with the specified width.
 * @param paraWidth - The width of the paragraph
 *
 * @note Haskell: `emptyPara :: Int -> Para`
 */
const emptyPara = (paraWidth: number): Para => ({
  width: paraWidth,
  content: {
    fullLines: [],
    lastLine: [],
  },
});

/**
 * Flows text into multiple columns of specified width and height.
 * @param self - The text to flow into columns
 * @param a - Alignment for text within each column
 * @param w - Width of each column
 * @param h - Maximum height of each column
 *
 * @note Haskell: `columns :: Alignment -> Int -> Int -> String -> [Box]`
 */
export const columns = dual<
  (a: Alignment, w: number, h: number) => (self: string) => Box[],
  (self: string, a: Alignment, w: number, h: number) => Box[]
>(4, (self, a, w, h) =>
  pipe(self, flow(w), Array.chunksOf(h), Array.map(mkParaBox(a, h)))
);

/**
 * Creates a paragraph box from text lines with specified alignment and height.
 * @param self - Array of text lines
 * @param a - Alignment for the text
 * @param n - Height of the resulting box
 *
 * @note Haskell: `mkParaBox :: Alignment -> Int -> [String] -> Box`
 */
const mkParaBox = dual<
  (a: Alignment, n: number) => (self: string[]) => Box,
  (self: string[], a: Alignment, n: number) => Box
>(3, (self, a, n) => {
  if (self.length === 0) {
    return emptyBox(n, 0);
  }
  return pipe(self, Array.map(text), vcat(a), alignVert(top, n));
});

/**
 * Regular expression for splitting text on whitespace
 */
const whitespaceRegex = /\s+/;

/**
 * Breaks text into lines that fit within the specified width.
 * @param self - The text to flow
 * @param width - Maximum width for each line
 *
 * @note Haskell: `flow :: Int -> String -> [String]`
 */
const flow = dual<
  (width: number) => (self: string) => string[],
  (self: string, width: number) => string[]
>(2, (self, width) => {
  if (self.trim() === "") {
    return [""];
  }

  return pipe(
    self,
    String.split(whitespaceRegex),
    Array.filter((word) => word.length > 0),
    Array.reduce(emptyPara(width), addWordP),
    getLines,
    Array.map((line) => line.slice(0, width))
  );
});

/**
 * Extracts finished lines from a paragraph structure.
 * @param para - The paragraph structure to extract lines from
 *
 * @note Haskell: `getLines :: Para -> [String]`
 */
const getLines = ({ content: { fullLines, lastLine } }: Para): string[] => {
  const process = (lines: readonly (readonly string[])[]): string[] =>
    pipe(
      Array.fromIterable(lines),
      Array.reverse,
      Array.map((line) => pipe(line, Array.reverse, Array.join(" ")))
    );

  return process(lastLine.length === 0 ? fullLines : [lastLine, ...fullLines]);
};

/**
 * Adds a word to a paragraph, starting a new line if necessary.
 * @param para - The paragraph to add the word to
 * @param word - The word to add
 *
 * @note Haskell: `addWordP :: Para -> Word -> Para`
 */
const addWordP = (para: Para, word: string): Para => {
  return {
    width: para.width,
    content: wordFits(para, word)
      ? {
          fullLines: para.content.fullLines,
          lastLine: [word, ...para.content.lastLine] as readonly string[],
        }
      : {
          fullLines:
            para.content.lastLine.length === 0
              ? para.content.fullLines
              : ([
                  para.content.lastLine,
                  ...para.content.fullLines,
                ] as readonly (readonly string[])[]),
          lastLine: [word] as readonly string[],
        },
  };
};

/**
 * Checks if a word fits on the current line of a paragraph.
 * @param para - The paragraph structure
 * @param word - The word to check
 *
 * @note Haskell: `wordFits :: Int -> Word -> Line -> Bool`
 */
const wordFits = (
  { content: paraContent, width: paraWidth }: Para,
  word: string
): boolean => {
  if (paraContent.lastLine.length === 0) {
    return word.length <= paraWidth;
  }
  const currentLength = paraContent.lastLine.reduce(
    (acc: number, w: string) => acc + w.length,
    paraContent.lastLine.length - 1
  );
  return currentLength + 1 + word.length <= paraWidth;
};

/*
 *  --------------------------------------------------------------------------------
 *  --  Alignment  -----------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Horizontally aligns a box within a specified width.
 * @param self - The box to align
 * @param a - The horizontal alignment
 * @param c - The target width
 *
 * @note Haskell: `alignHoriz :: Alignment -> Int -> Box -> Box`
 */
export const alignHoriz = dual<
  (a: Alignment, c: number) => <A>(self: Box<A>) => Box<A>,
  <A>(self: Box<A>, a: Alignment, c: number) => Box<A>
>(
  3,
  <A>(self: Box<A>, a: Alignment, c: number): Box<A> =>
    align(self, a, left, self.rows, c)
);

/**
 * Vertically aligns a box within a specified height.
 * @param self - The box to align
 * @param a - The vertical alignment
 * @param r - The target height
 *
 * @note Haskell: `alignVert :: Alignment -> Int -> Box -> Box`
 */
export const alignVert = dual<
  (a: Alignment, r: number) => <A>(self: Box<A>) => Box<A>,
  <A>(self: Box<A>, a: Alignment, r: number) => Box<A>
>(
  3,
  <A>(self: Box<A>, a: Alignment, r: number): Box<A> =>
    align(self, top, a, r, self.cols)
);

/**
 * Aligns a box within specified dimensions using both horizontal and vertical alignment.
 * @param self - The box to align
 * @param ah - Horizontal alignment
 * @param av - Vertical alignment
 * @param r - Target height
 * @param c - Target width
 *
 * @note Haskell: `align :: Alignment -> Alignment -> Int -> Int -> Box -> Box`
 */
export const align = dual<
  (
    ah: Alignment,
    av: Alignment,
    r: number,
    c: number
  ) => <A>(self: Box<A>) => Box<A>,
  <A>(
    self: Box<A>,
    ah: Alignment,
    av: Alignment,
    r: number,
    c: number
  ) => Box<A>
>(
  5,
  <A>(
    self: Box<A>,
    ah: Alignment,
    av: Alignment,
    r: number,
    c: number
  ): Box<A> => {
    return make({
      rows: r,
      cols: c,
      content: {
        _tag: "SubBox",
        xAlign: ah,
        yAlign: av,
        box: self,
      },
      annotation: self.annotation,
    });
  }
);

/**
 * Aligns a box to the left. This is a convenience function that ensures
 * left alignment without changing the box dimensions.
 * @param self - The box to align left
 *
 * @example
 * ```typescript
 * const leftAligned = Box.text("Hello\nWorld").pipe(Box.alignLeft)
 * ```
 */
export const alignLeft = <A>(self: Box<A>): Box<A> =>
  alignHoriz(self, left, self.cols);

/**
 * Moves a box up by adding empty rows below it.
 * @param self - The box to move
 * @param n - Number of rows to add below
 *
 * @note Haskell: `moveUp :: Int -> Box -> Box`
 */
export const moveUp = dual<
  (n: number) => <A>(b: Box<A>) => Box<A>,
  <A>(self: Box<A>, n: number) => Box<A>
>(
  2,
  <A>(self: Box<A>, n: number): Box<A> => alignVert(self, top, self.rows + n)
);

/**
 * Moves a box down by adding empty rows above it.
 * @param self - The box to move
 * @param n - Number of rows to add above
 *
 * @note Haskell: `moveDown :: Int -> Box -> Box`
 */
export const moveDown = dual<
  (n: number) => <A>(self: Box<A>) => Box<A>,
  <A>(self: Box<A>, n: number) => Box<A>
>(
  2,
  <A>(self: Box<A>, n: number): Box<A> => alignVert(self, bottom, self.rows + n)
);

/**
 * Moves a box left by adding empty columns to the right.
 * @param self - The box to move
 * @param n - Number of columns to add to the right
 *
 * @note Haskell: `moveLeft :: Int -> Box -> Box`
 */
export const moveLeft = dual<
  (n: number) => <A>(self: Box<A>) => Box<A>,
  <A>(self: Box<A>, n: number) => Box<A>
>(
  2,
  <A>(self: Box<A>, n: number): Box<A> => alignHoriz(self, left, self.cols + n)
);

/**
 * Moves a box right by adding empty columns to the left.
 * @param self - The box to move
 * @param n - Number of columns to add to the left
 *
 * @note Haskell: `moveRight :: Int -> Box -> Box`
 */
export const moveRight = dual<
  (n: number) => <A>(self: Box<A>) => Box<A>,
  <A>(self: Box<A>, n: number) => Box<A>
>(
  2,
  <A>(self: Box<A>, n: number): Box<A> => alignHoriz(self, right, self.cols + n)
);

/*
 *  --------------------------------------------------------------------------------
 *  --  Implementation  ------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Configuration options for rendering boxes with annotations.
 */
export interface RenderConfig {
  readonly style?: "pretty" | "plain";
  readonly preserveWhitespace?: boolean;
  readonly partial?: boolean;
}

/**
 * Default render configuration for backwards compatibility (plain mode).
 */
export const defaultRenderConfig: RenderConfig = {
  style: "plain",
  preserveWhitespace: false,
  partial: false,
};

/**
 * Merges multiple arrays of rendered text lines into a single array.
 * @param renderedBoxes - Arrays of text lines to merge
 *
 * @note Haskell: `merge = foldr (zipWith (++)) (repeat [])`
 */
export const merge = (renderedBoxes: string[][]): string[] => {
  if (renderedBoxes.length === 0) {
    return [];
  }
  return pipe(
    Array.makeBy(
      Math.max(...renderedBoxes.map((lines) => lines.length)),
      (i) => i
    ),
    Array.map((rowIndex) =>
      pipe(
        renderedBoxes,
        Array.reduce("", (acc, lines) => acc + (lines[rowIndex] ?? ""))
      )
    )
  );
};

/**
 * Converts a box into an array of text lines for display.
 * @param self - The box to render as text lines
 *
 * @note Haskell: `renderBox :: Box -> [String]`
 */
const renderBox = <A>({ cols, content, rows }: Box<A>): string[] => {
  if (rows === 0 || cols === 0) {
    return [];
  }

  return pipe(
    content,
    Match.type<Content<A>>().pipe(
      Match.tag("Blank", () => resizeBox([""], rows, cols)),
      Match.tag("Text", ({ text }) => resizeBox([text], rows, cols)),
      Match.tag("Row", ({ boxes }) =>
        pipe(Array.map(boxes, renderBox), merge, resizeBox(rows, cols))
      ),
      Match.tag("Col", ({ boxes }) =>
        pipe(Array.flatMap(boxes, renderBox), resizeBox(rows, cols))
      ),
      Match.tag("SubBox", ({ box, xAlign, yAlign }) =>
        pipe(renderBox(box), resizeBoxAligned(rows, cols, xAlign, yAlign))
      ),
      Match.exhaustive
    )
  );
};

/**
 * Takes up to n elements from an array, padding with a default value if needed.
 * @param self - Source array
 * @param a - Default value to use for padding
 * @param n - Target length
 *
 * @note Haskell: `takeP :: a -> Int -> [a] -> [a]`
 */
export const takeP = dual<
  <A>(a: A, n: number) => (self: readonly A[]) => A[],
  <A>(self: readonly A[], a: A, n: number) => A[]
>(3, (self, a, n) => {
  if (n <= 0) {
    return [];
  }
  if (self.length === 0) {
    return Array.makeBy(n, () => a);
  }
  if (n <= self.length) {
    return self.slice(0, n);
  }
  return [...self, ...Array.makeBy(n - self.length, () => a)];
});

/**
 * Takes elements from an array with alignment, padding as needed.
 * @param self - Source array
 * @param alignment - How to align the original array within the result
 * @param a - Default value for padding
 * @param n - Target length
 *
 * @note Haskell: `takePA :: Alignment -> a -> Int -> [a] -> [a]`
 */
export const takePA = dual<
  <A>(alignment: Alignment, a: A, n: number) => (xs: readonly A[]) => A[],
  <A>(self: readonly A[], alignment: Alignment, a: A, n: number) => A[]
>(4, <A>(self: readonly A[], alignment: Alignment, a: A, n: number) => {
  if (n <= 0) {
    return [];
  }

  const numRev = (align: Alignment, size: number): number =>
    Match.value(align).pipe(
      Match.when("AlignFirst", () => 0),
      Match.when("AlignLast", () => size),
      Match.when("AlignCenter1", () => Math.ceil(size / 2)),
      Match.when("AlignCenter2", () => Math.floor(size / 2)),
      Match.exhaustive
    );

  const numFwd = (align: Alignment, size: number): number =>
    Match.value(align).pipe(
      Match.when("AlignFirst", () => size),
      Match.when("AlignLast", () => 0),
      Match.when("AlignCenter1", () => Math.floor(size / 2)),
      Match.when("AlignCenter2", () => Math.ceil(size / 2)),
      Match.exhaustive
    );

  const splitPos = numRev(alignment, self.length);
  const prefix = [...self.slice(0, splitPos)].reverse();
  const suffix = self.slice(splitPos);

  return [
    ...takeP(prefix, a, numRev(alignment, n)).reverse(),
    ...takeP(suffix, a, numFwd(alignment, n)),
  ];
});

/**
 * Creates a string of spaces with the specified length.
 * @param n - Number of spaces to generate
 *
 * @note Haskell: `blanks :: Int -> String`
 */
export const blanks = (n: number): string =>
  pipe(" ", String.repeat(Math.max(0, n)));

/**
 * Adjusts the size of rendered text lines to specific dimensions.
 * @param self - Text lines to resize
 * @param r - Target number of rows
 * @param c - Target number of columns
 *
 * @note Haskell: `resizeBox :: Int -> Int -> [String] -> [String]`
 */
export const resizeBox = dual<
  (r: number, c: number) => (self: string[]) => string[],
  (self: string[], r: number, c: number) => string[]
>(3, (self, r, c) =>
  takeP(
    self.map((line) => takeP([...line], " ", c)).map((chars) => chars.join("")),
    blanks(c),
    r
  )
);

/**
 * Adjusts the size of rendered text lines with alignment options.
 * @param self - Text lines to resize
 * @param r - Target number of rows
 * @param c - Target number of columns
 * @param ha - Horizontal alignment
 * @param va - Vertical alignment
 *
 * @note Haskell: `resizeBoxAligned :: Int -> Int -> Alignment -> Alignment -> [String] -> [String]`
 */
export const resizeBoxAligned = dual<
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
    self.map((line) => takePA([...line], ha, " ", c).join("")),
    va,
    blanks(c),
    r
  )
);

/**
 * Converts a box to a string suitable for display, removing trailing whitespace.
 * Supports optional RenderConfig to control styling behavior.
 * @param self - The box to render
 * @param config - Optional render configuration (defaults to pretty style)
 *
 * @note Haskell: `render :: Box -> String`
 */
export const render = <A>(self: Box<A>, config?: RenderConfig) => {
  const { preserveWhitespace, style } = config ?? defaultRenderConfig;
  const rendered = renderBox(self);

  return pipe(
    Match.value(style ?? "pretty").pipe(
      Match.when("plain", () => renderBox(self)),
      Match.when("pretty", () => renderAnnotatedBox(self)),
      Match.exhaustive
    ),
    (a) => (preserveWhitespace ? a : a.map(String.trimEnd)),
    Array.join("\n"),
    (d) => (config?.partial ? d : d + (rendered.length > 0 ? "\n" : ""))
  );
};

/**
 * Converts a box to a string while preserving all whitespace including trailing spaces.
 * @param self - The box to render
 *
 * @note Haskell: `renderWithSpaces :: Box -> String`
 */
export const renderWithSpaces = <A>(self: Box<A>): string =>
  pipe(
    renderBox(self as Box<never>),
    Array.join("\n"),
    (d) => d + (renderBox(self as Box<never>).length > 0 ? "\n" : "")
  );

/**
 * Converts a box to a string using a custom separator instead of spaces.
 * @param self - The box to render
 * @param sep - Separator to use instead of spaces (default is a single space)
 */
export const renderWith = dual<
  (sep?: string) => <A>(self: Box<A>) => string,
  <A>(self: Box<A>, sep?: string) => string
>(2, <A>(self: Box<A>, sep?: string): string =>
  pipe(renderWithSpaces(self), String.replace(/ /g, sep ?? " "))
);

/**
 * Prints a box to the console using the Effect Console.
 * @param b - The box to print
 *
 * @note Haskell: `printBox :: Box -> IO ()`
 */
export const printBox = <A>(b: Box<A>) =>
  Effect.gen(function* () {
    yield* Console.log(render(b, { style: "pretty" }));
  });

/*
 *  --------------------------------------------------------------------------------
 *  --  Annotation Functions  ------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Adds an annotation to a box. Supports dual signatures:
 * - annotate(box, annotation): Box<A>
 * - annotate(annotation)(box): Box<A>
 *
 * @param self - The box to annotate
 * @param annotation - The annotation to add
 */
export const annotate = dual<
  <A>(annotation: Annotation<A>) => <B>(self: Box<B>) => Box<A>,
  <B, A>(self: Box<B>, annotation: Annotation<A>) => Box<A>
>(
  2,
  <B, A>(self: Box<B>, annotation: Annotation<A>): Box<A> =>
    make({
      rows: self.rows,
      cols: self.cols,
      content: self.content as Content<A>, // Cast is safe - content structure is preserved
      annotation,
    })
);

/**
 * Removes the annotation from a box, returning a Box<never>.
 *
 * @param self - The box to remove annotation from
 */
export const unAnnotate = <A>(self: Box<A>): Box<never> =>
  make({
    rows: self.rows,
    cols: self.cols,
    content: self.content as Content<never>, // Safe cast - removing annotations
  });

/**
 * Transforms the annotation of a box using a provided function.
 * If the box has no annotation, returns the box unchanged.
 *
 * @param self - The box with annotation to transform
 * @param transform - Function to transform the annotation
 */
export const reAnnotate = dual<
  <A, B>(transform: (annotation: A) => B) => (self: Box<A>) => Box<B>,
  <A, B>(self: Box<A>, transform: (annotation: A) => B) => Box<B>
>(2, <A, B>(self: Box<A>, transform: (annotation: A) => B): Box<B> => {
  if (!self.annotation) {
    throw new Error("Cannot reAnnotate: Box has no annotation to transform");
  }

  return make({
    rows: self.rows,
    cols: self.cols,
    content: self.content as Content<B>, // Safe cast - content structure preserved
    annotation: {
      ...self.annotation,
      data: transform(self.annotation.data),
    } as Annotation<B>,
  });
});

/**
 * Applies a function to modify annotations within a box structure, creating multiple boxes.
 * The alter function receives an annotation and returns an array of new annotations.
 * Returns an array of boxes, one for each annotation returned by the alter function.
 * If the box has no annotation, throws an error.
 *
 * @param self - The box to process (must have an annotation)
 * @param alter - Function that takes an annotation and returns an array of new annotations
 * @returns Array of boxes, one for each annotation returned by alter function
 */
export const alterAnnotations = dual<
  <A, B>(alter: (annotation: A) => B[]) => (self: Box<A>) => Box<B>[],
  <A, B>(self: Box<A>, alter: (annotation: A) => B[]) => Box<B>[]
>(2, <A, B>(self: Box<A>, alter: (annotation: A) => B[]): Box<B>[] => {
  // Box must have an annotation to alter
  if (!self.annotation) {
    throw new Error("Cannot alter annotations on a box without annotation");
  }

  // Apply alter function to get array of new annotations
  const newAnnotations = alter(self.annotation.data);

  // Helper to recursively process content
  // We don't alter annotations in nested content - only the top-level box annotation
  const processContent = (content: Content<A>): Content<B> => {
    return pipe(
      content,
      Match.type<Content<A>>().pipe(
        Match.tag("Blank", (blank) => blank),
        Match.tag("Text", (text) => text),
        Match.tag("Row", ({ boxes }) => ({
          _tag: "Row" as const,
          boxes: boxes as unknown as Box<B>[], // Type cast - nested boxes maintain their structure
        })),
        Match.tag("Col", ({ boxes }) => ({
          _tag: "Col" as const,
          boxes: boxes as unknown as Box<B>[], // Type cast - nested boxes maintain their structure
        })),
        Match.tag("SubBox", ({ box, xAlign, yAlign }) => ({
          _tag: "SubBox" as const,
          box: box as unknown as Box<B>, // Type cast - nested box maintains its structure
          xAlign,
          yAlign,
        })),
        Match.exhaustive
      )
    );
  };

  // Create a box for each new annotation
  return newAnnotations.map((newAnnotation) =>
    make({
      rows: self.rows,
      cols: self.cols,
      content: processContent(self.content),
      annotation: { ...self.annotation, data: newAnnotation } as Annotation<B>,
    })
  );
});

/**
 * Alias for `alterAnnotations` - applies a function to modify annotations within a box structure, creating multiple boxes.
 * The alter function receives an annotation and returns an array of new annotations.
 * Returns an array of boxes, one for each annotation returned by the alter function.
 * If the box has no annotation, throws an error.
 *
 * @param self - The box to process (must have an annotation)
 * @param alter - Function that takes an annotation and returns an array of new annotations
 * @returns Array of boxes, one for each annotation returned by alter function
 */
export const alterAnnotate = alterAnnotations;
