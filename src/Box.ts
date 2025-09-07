import { Array, Console, Effect, Match, pipe, String } from "effect";
import * as Equal from "effect/Equal";
import { dual } from "effect/Function";
import * as Hash from "effect/Hash";
import { type Pipeable, pipeArguments } from "effect/Pipeable";

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
type Row = { _tag: "Row"; boxes: Box[] };
type Col = { _tag: "Col"; boxes: Box[] };
type SubBox = {
  _tag: "SubBox";
  xAlign: Alignment;
  yAlign: Alignment;
  box: Box;
};

export type Content = Blank | Text | Row | Col | SubBox;

/**
 * The Box data type, representing a rectangular area of text with various combinators for layout and alignment.
 */
export interface Box extends Pipeable, Equal.Equal, Hash.Hash {
  readonly [BoxTypeId]: BoxTypeId;
  readonly rows: number;
  readonly cols: number;
  readonly content: Content;
}

const isBox = (u: unknown): u is Box =>
  typeof u === "object" && u != null && BoxTypeId in u;

const contentEquals = (self: Content, that: Content): boolean => {
  if (self._tag !== that._tag) {
    return false;
  }

  return pipe(
    self,
    Match.type<Content>().pipe(
      Match.tag("Blank", () => true),
      Match.tag("Text", ({ text }) => text === (that as Text).text),
      Match.tag(
        "Row",
        ({ boxes }) =>
          boxes.length === (that as Row).boxes.length &&
          boxes.every((box, i) => Equal.equals(box, (that as Row).boxes[i]))
      ),
      Match.tag(
        "Col",
        ({ boxes }) =>
          boxes.length === (that as Col).boxes.length &&
          boxes.every((box, i) => Equal.equals(box, (that as Col).boxes[i]))
      ),
      Match.tag(
        "SubBox",
        ({ box, xAlign, yAlign }) =>
          xAlign === (that as SubBox).xAlign &&
          yAlign === (that as SubBox).yAlign &&
          Equal.equals(box, (that as SubBox).box)
      ),
      Match.exhaustive
    )
  );
};

const contentHash = (content: Content): number =>
  pipe(
    content,
    Match.type<Content>().pipe(
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

const proto: Omit<Box, "rows" | "content" | "cols"> = {
  [BoxTypeId]: BoxTypeId,
  [Equal.symbol](this: Box, that: unknown): boolean {
    return (
      isBox(that) &&
      this.rows === that.rows &&
      this.cols === that.cols &&
      contentEquals(this.content, that.content)
    );
  },
  [Hash.symbol](this: Box) {
    return Hash.cached(
      this,
      pipe(
        Hash.hash(this.rows),
        Hash.combine(Hash.hash(this.cols)),
        Hash.combine(contentHash(this.content))
      )
    );
  },
  pipe() {
    // biome-ignore lint/correctness/noUndeclaredVariables: typescript does not recognize that this is a method on Box
    return pipeArguments(this, arguments);
  },
};

export const make = (b: {
  rows: number;
  cols: number;
  content: Content;
}): Box => {
  const box = Object.create(proto);
  box.rows = Math.max(0, b.rows);
  box.cols = Math.max(0, b.cols);
  box.content = b.content;

  return box;
};

/**
 * Creates an empty box with no content.
 *
 * @note Haskell: `nullBox :: Box`
 */
export const nullBox: Box = make({
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
export const emptyBox = (rows: number, cols: number): Box =>
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
export const char = (c: string): Box =>
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
const unsafeLine = (t: string): Box =>
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
export const text = (s: string): Box =>
  pipe(s, String.split("\n"), Array.map(unsafeLine), vcat(left));

/**
 * Creates a single-line box from a string, removing any line breaks.
 * @param s - The text string (line breaks will be stripped)
 *
 * @note Haskell: `line :: String -> Box`
 */
export const line = (s: string): Box =>
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
  (a: Alignment, w: number) => (self: string) => Box,
  (self: string, a: Alignment, w: number) => Box
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
  (l: Box) => (self: Box) => Box,
  (self: Box, l: Box) => Box
>(2, (self, l) => hcat([self, l], top));

export const combineMany = dual<
  (start: Box) => (self: Iterable<Box>) => Box,
  (self: Iterable<Box>, start: Box) => Box
>(2, (self, start) => hcat([start, ...Array.fromIterable(self)], top));

/**
 * Combines all boxes in a collection horizontally, returning nullBox if empty.
 * @param collection - The collection of boxes to combine
 *
 * @note Haskell: `instance Monoid Box where mempty = nullBox mappend = (<>) mconcat = hcat top`
 */
export const combineAll = (collection: Iterable<Box>): Box => {
  const boxes = Array.fromIterable(collection);
  return boxes.length === 0 ? nullBox : hcat(boxes, top);
};

/**
 * Gets the number of rows in a box.
 * @param b - The box to measure
 *
 * @note Haskell: `rows :: Box -> Int`
 */
export const rows = (b: Box): number => b.rows;

/**
 * Gets the number of columns in a box.
 * @param b - The box to measure
 *
 * @note Haskell: `cols :: Box -> Int`
 */
export const cols = (b: Box): number => b.cols;

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
  (a: Alignment) => (self: readonly Box[]) => Box,
  (self: readonly Box[], a: Alignment) => Box
>(2, (self, a) => {
  const [w, h] = sumMax(cols, 0, rows, self);
  return make({
    rows: h,
    cols: w,
    content: {
      _tag: "Row",
      boxes: self.map(alignVert(a, h)),
    },
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
  (a: Alignment) => (self: readonly Box[]) => Box,
  (self: readonly Box[], a: Alignment) => Box
>(2, (self, a) => {
  const [h, w] = sumMax(rows, 0, cols, self);
  return make({
    rows: h,
    cols: w,
    content: {
      _tag: "Col",
      boxes: self.map(alignHoriz(a, w)),
    },
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
  (l: Box) => (self: Box) => Box,
  (self: Box, l: Box) => Box
>(2, (self, l) => hcat([self, l], top));

/**
 * Places two boxes side by side with a single space column between them.
 * @param self - The first box
 * @param l - The second box to place to the right
 *
 * @note Haskell: `(<+>) :: Box -> Box -> Box`
 */
export const hcatWithSpace = dual<
  (l: Box) => (self: Box) => Box,
  (self: Box, l: Box) => Box
>(2, (self, l) => hcat([self, emptyBox(0, 1), l], top));

/**
 * Stacks two boxes vertically, one above the other.
 * @param self - The top box
 * @param t - The bottom box
 *
 * @note Haskell: `(//) :: Box -> Box -> Box`
 */
export const vAppend = dual<
  (t: Box) => (self: Box) => Box,
  (self: Box, t: Box) => Box
>(2, (self, t) => vcat([self, t], left));

/**
 * Stacks two boxes vertically with a single empty row between them.
 * @param self - The top box
 * @param t - The bottom box
 *
 * @note Haskell: `(/+/) :: Box -> Box -> Box`
 */
export const vcatWithSpace = dual<
  (t: Box) => (self: Box) => Box,
  (self: Box, t: Box) => Box
>(2, (self, t) => vcat([self, emptyBox(1, 0), t], left));

/**
 * Arranges boxes horizontally with a separator box placed between each pair.
 * @param self - Array of boxes to arrange
 * @param a - Vertical alignment for the arrangement
 * @param p - Separator box to place between each pair of boxes
 *
 * @note Haskell: `punctuateH :: Foldable f => Alignment -> Box -> f Box -> Box`
 */
export const punctuateH = dual<
  (a: Alignment, p: Box) => (self: readonly Box[]) => Box,
  (self: readonly Box[], a: Alignment, p: Box) => Box
>(3, (self, a, p) => {
  if (self.length === 0) {
    return nullBox;
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
  (a: Alignment, p: Box) => (self: readonly Box[]) => Box,
  (self: readonly Box[], a: Alignment, p: Box) => Box
>(3, (self, a, p) => {
  if (self.length === 0) {
    return nullBox;
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
  (sep: number, a: Alignment) => (self: readonly Box[]) => Box,
  (self: readonly Box[], sep: number, a: Alignment) => Box
>(3, (self, sep, a) => punctuateH(self, a, emptyBox(0, sep)));

/**
 * Arranges boxes vertically with the specified amount of space between each.
 * @param self - Array of boxes to arrange
 * @param sep - Number of empty rows to place between boxes
 * @param a - Horizontal alignment for the arrangement
 *
 * @note Haskell: `vsep :: Foldable f => Int -> Alignment -> f Box -> Box`
 */
export const vsep = dual<
  (sep: number, a: Alignment) => (bs: readonly Box[]) => Box,
  (self: readonly Box[], sep: number, a: Alignment) => Box
>(3, (self, sep, a) => punctuateV(self, a, emptyBox(sep, 0)));

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
  (a: Alignment, c: number) => (self: Box) => Box,
  (self: Box, a: Alignment, c: number) => Box
>(3, (self, a, c) => align(self, a, left, self.rows, c));

/**
 * Vertically aligns a box within a specified height.
 * @param self - The box to align
 * @param a - The vertical alignment
 * @param r - The target height
 *
 * @note Haskell: `alignVert :: Alignment -> Int -> Box -> Box`
 */
export const alignVert = dual<
  (a: Alignment, r: number) => (self: Box) => Box,
  (self: Box, a: Alignment, r: number) => Box
>(3, (self, a, r) => align(self, top, a, r, self.cols));

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
  (ah: Alignment, av: Alignment, r: number, c: number) => (self: Box) => Box,
  (self: Box, ah: Alignment, av: Alignment, r: number, c: number) => Box
>(5, (self, ah, av, r, c) =>
  make({
    rows: r,
    cols: c,
    content: {
      _tag: "SubBox",
      xAlign: ah,
      yAlign: av,
      box: make({ rows: self.rows, cols: self.cols, content: self.content }),
    },
  })
);

/**
 * Moves a box up by adding empty rows below it.
 * @param self - The box to move
 * @param n - Number of rows to add below
 *
 * @note Haskell: `moveUp :: Int -> Box -> Box`
 */
export const moveUp = dual<
  (n: number) => (b: Box) => Box,
  (self: Box, n: number) => Box
>(2, (self, n) => alignVert(self, top, self.rows + n));

/**
 * Moves a box down by adding empty rows above it.
 * @param self - The box to move
 * @param n - Number of rows to add above
 *
 * @note Haskell: `moveDown :: Int -> Box -> Box`
 */
export const moveDown = dual<
  (n: number) => (self: Box) => Box,
  (self: Box, n: number) => Box
>(2, (self, n) => alignVert(self, bottom, self.rows + n));

/**
 * Moves a box left by adding empty columns to the right.
 * @param self - The box to move
 * @param n - Number of columns to add to the right
 *
 * @note Haskell: `moveLeft :: Int -> Box -> Box`
 */
export const moveLeft = dual<
  (n: number) => (self: Box) => Box,
  (self: Box, n: number) => Box
>(2, (self, n) => alignHoriz(self, left, self.cols + n));

/**
 * Moves a box right by adding empty columns to the left.
 * @param self - The box to move
 * @param n - Number of columns to add to the left
 *
 * @note Haskell: `moveRight :: Int -> Box -> Box`
 */
export const moveRight = dual<
  (n: number) => (self: Box) => Box,
  (self: Box, n: number) => Box
>(2, (self, n) => alignHoriz(self, right, self.cols + n));

/*
 *  --------------------------------------------------------------------------------
 *  --  Implementation  ------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Merges multiple arrays of rendered text lines into a single array.
 * @param renderedBoxes - Arrays of text lines to merge
 *
 * @note Haskell: `merge = foldr (zipWith (++)) (repeat [])`
 */
const merge = (renderedBoxes: string[][]): string[] => {
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
const renderBox = ({ cols, content, rows }: Box): string[] => {
  if (rows === 0 || cols === 0) {
    return [];
  }

  return pipe(
    content,
    Match.type<Content>().pipe(
      Match.tag("Blank", () => resizeBox([""], rows, cols)),
      Match.tag("Text", ({ text }) => resizeBox([text], rows, cols)),
      Match.tag("Row", ({ boxes }) =>
        pipe(
          boxes,
          Array.map(renderBoxWithRows(rows)),
          merge,
          resizeBox(rows, cols)
        )
      ),
      Match.tag("Col", ({ boxes }) =>
        pipe(
          boxes,
          Array.flatMap(renderBoxWithCols(cols)),
          resizeBox(rows, cols)
        )
      ),
      Match.tag("SubBox", ({ box, xAlign, yAlign }) =>
        pipe(box, renderBox, resizeBoxAligned(rows, cols, xAlign, yAlign))
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
const takeP = dual<
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
const takePA = dual<
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
const blanks = (n: number): string => pipe(" ", String.repeat(Math.max(0, n)));

/**
 * Renders a box with a specific number of rows.
 * @param self - The box to render
 * @param r - Target number of rows
 *
 * @note Haskell: `renderBoxWithRows :: Int -> Box -> [String]`
 */
const renderBoxWithRows = dual<
  (r: number) => (self: Box) => string[],
  (self: Box, r: number) => string[]
>(2, (self, r) => renderBox({ ...self, rows: r }));

/**
 * Renders a box with a specific number of columns.
 * @param self - The box to render
 * @param c - Target number of columns
 *
 * @note Haskell: `renderBoxWithCols :: Int -> Box -> [String]`
 */
const renderBoxWithCols = dual<
  (c: number) => (self: Box) => string[],
  (self: Box, c: number) => string[]
>(2, (self, c) => renderBox({ ...self, cols: c }));

/**
 * Adjusts the size of rendered text lines to specific dimensions.
 * @param self - Text lines to resize
 * @param r - Target number of rows
 * @param c - Target number of columns
 *
 * @note Haskell: `resizeBox :: Int -> Int -> [String] -> [String]`
 */
const resizeBox = dual<
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
const resizeBoxAligned = dual<
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
 * @param self - The box to render
 *
 * @note Haskell: `render :: Box -> String`
 */
export const render = (self: Box): string =>
  pipe(
    renderBox(self),
    Array.map(String.trimEnd),
    Array.join("\n"),
    (d) => d + (renderBox(self).length > 0 ? "\n" : "")
  );

/**
 * Converts a box to a string while preserving all whitespace including trailing spaces.
 * @param self - The box to render
 *
 * @note Haskell: `renderWithSpaces :: Box -> String`
 */
export const renderWithSpaces = (self: Box): string =>
  pipe(
    renderBox(self),
    Array.join("\n"),
    (d) => d + (renderBox(self).length > 0 ? "\n" : "")
  );

/**
 * Converts a box to a string using a custom separator instead of spaces.
 * @param self - The box to render
 * @param sep - Separator to use instead of spaces (default is a single space)
 */
export const renderWith = dual<
  (sep?: string) => (self: Box) => string,
  (self: Box, sep?: string) => string
>(2, (self, sep) =>
  pipe(renderWithSpaces(self), String.replace(/ /g, sep ?? " "))
);

/**
 * Prints a box to the console using the Effect Console.
 * @param b - The box to print
 *
 * @note Haskell: `printBox :: Box -> IO ()`
 */
export const printBox = (b: Box) =>
  Effect.gen(function* () {
    yield* Console.log(render(b));
  });
