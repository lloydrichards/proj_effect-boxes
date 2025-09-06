import { Array, Console, Effect, Match, pipe, String } from "effect";
import { dual } from "effect/Function";
import { type Pipeable, pipeArguments } from "effect/Pipeable";

export const BoxTypeId: unique symbol = Symbol.for("@effect/Box");

export type BoxTypeId = typeof BoxTypeId;

// Data type for specifying the alignment of boxes.
export type Alignment =
  | "AlignFirst"
  | "AlignCenter1"
  | "AlignCenter2"
  | "AlignLast";

// Align boxes along their tops.
export const top: Alignment = "AlignFirst";

// Align boxes along their bottoms.
export const bottom: Alignment = "AlignLast";

// Align boxes to the left.
export const left: Alignment = "AlignFirst";

// Align boxes to the right.
export const right: Alignment = "AlignLast";

// Align boxes centered, but biased to the left/top in case of unequal parities.
export const center1: Alignment = "AlignCenter1";

// Align boxes centered, but biased to the right/bottom in case of unequal parities.
export const center2: Alignment = "AlignCenter2";

// Contents of a box.
export type Content =
  | { _tag: "Blank" }
  | { _tag: "Text"; text: string }
  | { _tag: "Row"; boxes: Box[] }
  | { _tag: "Col"; boxes: Box[] }
  | { _tag: "SubBox"; xAlign: Alignment; yAlign: Alignment; box: Box };

// The Box data type, representing a rectangular area of text with various combinators for layout and alignment.
export interface Box extends Pipeable {
  readonly [BoxTypeId]: BoxTypeId;
  readonly rows: number;
  readonly cols: number;
  readonly content: Content;
}

const proto: Omit<Box, "rows" | "content" | "cols"> = {
  [BoxTypeId]: BoxTypeId,
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

// The null box, which has no content and no size.  It is quite useless.
// nullBox :: Box
export const nullBox: Box = make({
  rows: 0,
  cols: 0,
  content: { _tag: "Blank" },
});

// @empty r c@ is an empty box with @r@ rows and @c@ columns.
// empty :: Int -> Int -> Box
export const emptyBox = (rows: number, cols: number): Box =>
  make({
    rows,
    cols,
    content: { _tag: "Blank" },
  });

// A @1x1@ box containing a single character.
// char :: Char -> Box
export const char = (c: string): Box =>
  make({
    rows: 1,
    cols: 1,
    content: { _tag: "Text", text: c[0] ?? " " },
  });

// unsafeLine :: String -> Box
const unsafeLine = (t: string): Box =>
  make({
    rows: 1,
    cols: t.length,
    content: { _tag: "Text", text: t },
  });

// A box containing lines of text.
// text :: String -> Box
export const text = (s: string): Box =>
  pipe(s, String.split("\n"), Array.map(unsafeLine), vcat(left));

// A (@1 x len@) box containing a string length @len@
// line :: String -> Box
export const line = (s: string): Box =>
  unsafeLine(String.replace(/\n|\r/g, "")(s));

// @para algn w t@ is a box of width @w@, containing text @t@, aligned according to @algn@, flowed to fit within the given width.
// para :: Alignment -> Int -> String -> Box
export const para = dual<
  (a: Alignment, w: number) => (self: string) => Box,
  (self: string, a: Alignment, w: number) => Box
>(3, (self, a, w) => {
  const lines = flow(self, w);
  return mkParaBox(a, lines.length, lines);
});

// Semigroup instance for Box
// instance Semigroup Box where
//     l <> r = hcat top [l,r]
export const combine = dual<
  (l: Box) => (self: Box) => Box,
  (self: Box, l: Box) => Box
>(2, (self, l) => hcat([self, l], top));

export const combineMany = dual<
  (start: Box) => (self: Iterable<Box>) => Box,
  (self: Iterable<Box>, start: Box) => Box
>(2, (self, start) => hcat([start, ...Array.fromIterable(self)], top));

// Monoid instance for Box (extends Semigroup with empty element)
// instance Monoid Box where
//     mempty = nullBox
//     mappend = (<>)
//     mconcat = hcat top
export const combineAll = (collection: Iterable<Box>): Box => {
  const boxes = Array.fromIterable(collection);
  return boxes.length === 0 ? nullBox : hcat(boxes, top);
};

// Get the number of rows in a box
// rows :: Box -> Int
export const rows = (b: Box): number => b.rows;

// Get the number of columns in a box
// cols :: Box -> Int
export const cols = (b: Box): number => b.cols;

// Calculate a sum and a maximum over a list in one pass. If the list is empty, the maximum is reported as the given default. This would normally be done using the foldl library, but we don't want that dependency.
// sumMax :: (Num n, Ord b, Foldable f) => (a -> n) -> b -> (a -> b) -> f a -> (n, b)
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

// Glue a list of boxes together horizontally, with the given alignment.
// hcat :: Foldable f => Alignment -> f Box -> Box
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

// Glue a list of boxes together vertically, with the given alignment.
// vcat :: Foldable f => Alignment -> f Box -> Box
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

// Paste two boxes together horizontally.
// instance Semigroup Box where
// l <> r = hcat top [l,r]
export const hAppend = dual<
  (l: Box) => (self: Box) => Box,
  (self: Box, l: Box) => Box
>(2, (self, l) => hcat([self, l], top));

// Paste two boxes together horizontally with a single intervening column of space.
// (<+>) :: Box -> Box -> Box
export const hcatWithSpace = dual<
  (l: Box) => (self: Box) => Box,
  (self: Box, l: Box) => Box
>(2, (self, l) => hcat([self, emptyBox(0, 1), l], top));

// Paste two boxes together vertically.
// (//) :: Box -> Box -> Box
export const vAppend = dual<
  (t: Box) => (self: Box) => Box,
  (self: Box, t: Box) => Box
>(2, (self, t) => vcat([self, t], left));

// Paste two boxes together vertically with a single intervening row of space.
// (/+/) :: Box -> Box -> Box
export const vcatWithSpace = dual<
  (t: Box) => (self: Box) => Box,
  (self: Box, t: Box) => Box
>(2, (self, t) => vcat([self, emptyBox(1, 0), t], left));

// @punctuateH a p bs@ horizontally lays out the boxes @bs@ with a copy of @p@ interspersed between each.
// punctuateH :: Foldable f => Alignment -> Box -> f Box -> Box
export const punctuateH = dual<
  (a: Alignment, p: Box) => (self: readonly Box[]) => Box,
  (self: readonly Box[], a: Alignment, p: Box) => Box
>(3, (self, a, p) => {
  if (self.length === 0) {
    return nullBox;
  }
  return hcat(Array.intersperse(self, p), a);
});

// A vertical version of 'punctuateH'.
// punctuateV :: Foldable f => Alignment -> Box -> f Box -> Box
export const punctuateV = dual<
  (a: Alignment, p: Box) => (self: readonly Box[]) => Box,
  (self: readonly Box[], a: Alignment, p: Box) => Box
>(3, (self, a, p) => {
  if (self.length === 0) {
    return nullBox;
  }
  return vcat(Array.intersperse(self, p), a);
});

// @hsep sep a bs@ lays out @bs@ horizontally with alignment @a@, with @sep@ amount of space in between each.
// hsep :: Foldable f => Int -> Alignment -> f Box -> Box
export const hsep = dual<
  (sep: number, a: Alignment) => (self: readonly Box[]) => Box,
  (self: readonly Box[], sep: number, a: Alignment) => Box
>(3, (self, sep, a) => punctuateH(self, a, emptyBox(0, sep)));

// @vsep sep a bs@ lays out @bs@ vertically with alignment @a@, with @sep@ amount of space in between each.
// vsep :: Foldable f => Int -> Alignment -> f Box -> Box
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

// emptyPara :: Int -> Para
const emptyPara = (paraWidth: number): Para => ({
  width: paraWidth,
  content: {
    fullLines: [],
    lastLine: [],
  },
});

// @columns w h t@ is a list of boxes, each of width @w@ and height at most @h@, containing text @t@ flowed into as many columns as necessary.
// columns :: Alignment -> Int -> Int -> String -> [Box]
export const columns = dual<
  (a: Alignment, w: number, h: number) => (self: string) => Box[],
  (self: string, a: Alignment, w: number, h: number) => Box[]
>(4, (self, a, w, h) =>
  pipe(
    flow(self, w),
    Array.chunksOf(h),
    Array.map((chunk) => mkParaBox(a, h, chunk))
  )
);

// @mkParaBox a n s@ makes a box of height @n@ with the text @s@ aligned according to @a@.
// mkParaBox :: Alignment -> Int -> [String] -> Box
const mkParaBox = (a: Alignment, n: number, s: string[]): Box => {
  if (s.length === 0) {
    return emptyBox(n, 0);
  }
  const textBoxes = s.map((line) => text(line));
  return alignVert(vcat(textBoxes, a), top, n);
};

// Regular expression for splitting text on whitespace
const whitespaceRegex = /\s+/;

// Flow the given text into the given width.
// flow :: Int -> String -> [String]
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

// getLines :: Para -> [String]
const getLines = ({ content: { fullLines, lastLine } }: Para): string[] => {
  const process = (lines: readonly (readonly string[])[]): string[] =>
    pipe(
      Array.fromIterable(lines),
      Array.reverse,
      Array.map((line) => pipe(line, Array.reverse, Array.join(" ")))
    );

  return process(lastLine.length === 0 ? fullLines : [lastLine, ...fullLines]);
};

// addWordP :: Para -> Word -> Para
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

// wordFits :: Int -> Word -> Line -> Bool
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

// @alignHoriz algn n bx@ creates a box of width @n@, with the contents and height of @bx@, horizontally aligned according to @algn@.
// alignHoriz :: Alignment -> Int -> Box -> Box
export const alignHoriz = dual<
  (a: Alignment, c: number) => (self: Box) => Box,
  (self: Box, a: Alignment, c: number) => Box
>(3, (self, a, c) => align(self, a, left, self.rows, c));

// @alignVert algn n bx@ creates a box of height @n@, with the contents and width of @bx@, vertically aligned according to @algn@.
// alignVert :: Alignment -> Int -> Box -> Box
export const alignVert = dual<
  (a: Alignment, r: number) => (self: Box) => Box,
  (self: Box, a: Alignment, r: number) => Box
>(3, (self, a, r) => align(self, top, a, r, self.cols));

// @align ah av r c bx@ creates an @r@ x @c@ box with the contents of @bx@, aligned horizontally according to @ah@ and vertically according to @av@.
// align :: Alignment -> Alignment -> Int -> Int -> Box -> Box
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

// Move a box "up" by putting it in a larger box with extra rows, aligned to the top.
// moveUp :: Int -> Box -> Box
export const moveUp = dual<
  (n: number) => (b: Box) => Box,
  (self: Box, n: number) => Box
>(2, (self, n) => alignVert(self, top, self.rows + n));

// Move a box down by putting it in a larger box with extra rows, aligned to the bottom.
// moveDown :: Int -> Box -> Box
export const moveDown = dual<
  (n: number) => (self: Box) => Box,
  (self: Box, n: number) => Box
>(2, (self, n) => alignVert(self, bottom, self.rows + n));

// Move a box left by putting it in a larger box with extra columns, aligned left.
// moveLeft :: Int -> Box -> Box
export const moveLeft = dual<
  (n: number) => (self: Box) => Box,
  (self: Box, n: number) => Box
>(2, (self, n) => alignHoriz(self, left, self.cols + n));

// Move a box right by putting it in a larger box with extra columns, aligned right.
// moveRight :: Int -> Box -> Box
export const moveRight = dual<
  (n: number) => (self: Box) => Box,
  (self: Box, n: number) => Box
>(2, (self, n) => alignHoriz(self, right, self.cols + n));

/*
 *  --------------------------------------------------------------------------------
 *  --  Implementation  ------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

// Helper function for merging rendered rows (equivalent to Haskell's merge)
// merge = foldr (zipWith (++)) (repeat [])
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

// Render a box as a list of lines.
// renderBox :: Box -> [String]
const renderBox = ({ cols, content, rows }: Box): string[] => {
  if (rows === 0 || cols === 0) {
    return [];
  }

  return pipe(
    content,
    Match.type<Content>().pipe(
      Match.tag("Blank", () => resizeBox(rows, cols, [""])),
      Match.tag("Text", ({ text }) => resizeBox(rows, cols, [text])),
      Match.tag("Row", ({ boxes }) =>
        resizeBox(
          rows,
          cols,
          merge(boxes.map((box) => renderBoxWithRows(rows, make(box))))
        )
      ),
      Match.tag("Col", ({ boxes }) =>
        resizeBox(
          rows,
          cols,
          boxes.flatMap((box) => renderBoxWithCols(cols, make(box)))
        )
      ),
      Match.tag("SubBox", ({ box, xAlign, yAlign }) =>
        resizeBoxAligned(rows, cols, xAlign, yAlign, renderBox(make(box)))
      ),
      Match.exhaustive
    )
  );
};

const trailingSpaceRegex = /\s+$/;

//  "Padded take": @takeP a n xs@ is the same as @take n xs@, if @n <= length xs@; otherwise it is @xs@ followed by enough copies of @a@ to make the length equal to @n@.
// takeP :: a -> Int -> [a] -> [a]
const takeP = <A>(a: A, n: number, xs: readonly A[]): A[] => {
  if (n <= 0) {
    return [];
  }
  if (xs.length === 0) {
    return Array.makeBy(n, () => a);
  }
  if (n <= xs.length) {
    return xs.slice(0, n);
  }
  return [...xs, ...Array.makeBy(n - xs.length, () => a)];
};

//  @takePA @ is like 'takeP', but with alignment.  That is, we imagine a copy of @xs@ extended infinitely on both sides with copies of @a@, and a window of size @n@ placed so that @xs@ has the specified alignment within the window; @takePA algn a n xs@ returns the contents of this window.
// takePA :: Alignment -> a -> Int -> [a] -> [a]
const takePA = <A>(
  alignment: Alignment,
  a: A,
  n: number,
  xs: readonly A[]
): A[] => {
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

  const splitPos = numRev(alignment, xs.length);
  const prefix = [...xs.slice(0, splitPos)].reverse();
  const suffix = xs.slice(splitPos);

  return [
    ...takeP(a, numRev(alignment, n), prefix).reverse(),
    ...takeP(a, numFwd(alignment, n), suffix),
  ];
};

// Generate a string of spaces.
// blanks :: Int -> String
const blanks = (n: number): string => pipe(" ", String.repeat(Math.max(0, n)));

// Render a box as a list of lines, using a given number of rows.
// renderBoxWithRows :: Int -> Box -> [String]
const renderBoxWithRows = (r: number, b: Box): string[] =>
  renderBox({ ...b, rows: r });

// Render a box as a list of lines, using a given number of columns.
// renderBoxWithCols :: Int -> Box -> [String]
const renderBoxWithCols = (c: number, b: Box): string[] =>
  renderBox({ ...b, cols: c });

// Resize a rendered list of lines.
// resizeBox :: Int -> Int -> [String] -> [String]
const resizeBox = (r: number, c: number, lines: string[]): string[] =>
  takeP(
    blanks(c),
    r,
    lines.map((line) => takeP(" ", c, [...line])).map((chars) => chars.join(""))
  );

// Resize a rendered list of lines, using given alignments.
// resizeBoxAligned :: Int -> Int -> Alignment -> Alignment -> [String] -> [String]
const resizeBoxAligned = (
  r: number,
  c: number,
  ha: Alignment,
  va: Alignment,
  lines: string[]
): string[] =>
  takePA(
    va,
    blanks(c),
    r,
    lines.map((line) => takePA(ha, " ", c, [...line]).join(""))
  );

// Render a 'Box' as a String, suitable for writing to the screen or a file.
// render :: Box -> String
export const render = (b: Box): string => {
  const lines = renderBox(b);
  return (
    Array.join(
      lines.map((l) => String.replace(trailingSpaceRegex, "")(l)),
      "\n"
    ) + (lines.length > 0 ? "\n" : "")
  );
};

// Like 'render' but preserves end-of-line whitespace.
// renderWithSpaces :: Box -> String
export const renderWithSpaces = (b: Box): string => {
  const lines = renderBox(b);
  return Array.join(lines, "\n") + (lines.length > 0 ? "\n" : "");
};

export const renderWith = (b: Box, sep = " ") =>
  pipe(renderWithSpaces(b), String.replace(/ /g, sep));

// A convenience function for rendering a box to stdout.
// printBox :: Box -> IO ()
export const printBox = (b: Box) =>
  Effect.gen(function* () {
    yield* Console.log(render(b));
  });
