import { Array, Console, Effect, Match, pipe, Schema, String } from "effect";

// Regular expression for splitting text on whitespace
const whitespaceRegex = /\s+/;

// Data type for specifying the alignment of boxes.
export const Alignment = Schema.Literal(
  "AlignFirst",
  "AlignCenter1",
  "AlignCenter2",
  "AlignLast"
);
export type Alignment = typeof Alignment.Type;

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

export interface Box {
  readonly rows: number;
  readonly cols: number;
  readonly content: Content;
}

// Contents of a box.
const Content = Schema.Union(
  Schema.TaggedStruct("Blank", {}),
  Schema.TaggedStruct("Text", { text: Schema.String }),
  Schema.TaggedStruct("Row", {
    boxes: Schema.Array(Schema.suspend((): Schema.Schema<Box> => Box)),
  }),
  Schema.TaggedStruct("Col", {
    boxes: Schema.Array(Schema.suspend((): Schema.Schema<Box> => Box)),
  }),
  Schema.TaggedStruct("SubBox", {
    xAlign: Alignment,
    yAlign: Alignment,
    box: Schema.suspend((): Schema.Schema<Box> => Box),
  })
);
type Content = typeof Content.Type;

// The basic data type.  A box has a specified size and some sort of contents.
export const Box = Schema.Struct({
  rows: Schema.Number,
  cols: Schema.Number,
  content: Content,
});

export // The null box, which has no content and no size.  It is quite useless.
// nullBox :: Box
const nullBox: Box = { rows: 0, cols: 0, content: { _tag: "Blank" } };

// @empty r c@ is an empty box with @r@ rows and @c@ columns.
// empty :: Int -> Int -> Box
export const emptyBox = (rows: number, cols: number): Box => ({
  rows: Math.max(0, rows),
  cols: Math.max(0, cols),
  content: { _tag: "Blank" },
});

// A @1x1@ box containing a single character.
// char :: Char -> Box
export const char = (c: string): Box => ({
  rows: 1,
  cols: 1,
  content: { _tag: "Text", text: c[0] ?? " " },
});

// unsafeLine :: String -> Box
const unsafeLine = (t: string): Box => ({
  rows: 1,
  cols: t.length,
  content: { _tag: "Text", text: t },
});

// A box containing lines of text.
// text :: String -> Box
export const text = (s: string): Box =>
  vcat(
    left,
    String.split(s, "\n").map((l) => unsafeLine(l))
  );

// A (@1 x len@) box containing a string length @len@
// line :: String -> Box
export const line = (s: string): Box =>
  unsafeLine(String.replace(/\n|\r/g, "")(s));

// @para algn w t@ is a box of width @w@, containing text @t@, aligned according to @algn@, flowed to fit within the given width.
// para :: Alignment -> Int -> String -> Box
export const para = (a: Alignment, w: number, t: string): Box => {
  const lines = flow(w, t);
  return mkParaBox(a, lines.length, lines);
};

// Semigroup instance for Box
// instance Semigroup Box where
//     l <> r = hcat top [l,r]
export const combine = (l: Box, r: Box): Box => hcat(top, [l, r]);
export const combineMany = (start: Box, collection: Iterable<Box>): Box =>
  hcat(top, [start, ...Array.fromIterable(collection)]);

// Monoid instance for Box (extends Semigroup with empty element)
// instance Monoid Box where
//     mempty = nullBox
//     mappend = (<>)
//     mconcat = hcat top
export const combineAll = (collection: Iterable<Box>): Box => {
  const boxes = Array.fromIterable(collection);
  return boxes.length === 0 ? nullBox : hcat(top, boxes);
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
export const hcat = (a: Alignment, bs: readonly Box[]): Box => {
  const [w, h] = sumMax(
    (b: Box) => b.cols,
    0,
    (b: Box) => b.rows,
    bs
  );
  return {
    rows: h,
    cols: w,
    content: {
      _tag: "Row",
      boxes: bs.map((b) => alignVert(a, h, b)),
    },
  };
};

// Glue a list of boxes together vertically, with the given alignment.
// vcat :: Foldable f => Alignment -> f Box -> Box
export const vcat = (a: Alignment, bs: readonly Box[]): Box => {
  const [h, w] = sumMax(
    (b: Box) => b.rows,
    0,
    (b: Box) => b.cols,
    bs
  );
  return {
    rows: h,
    cols: w,
    content: {
      _tag: "Col",
      boxes: bs.map((b) => alignHoriz(a, w, b)),
    },
  };
};

// Paste two boxes together horizontally.
// instance Semigroup Box where
// l <> r = hcat top [l,r]
export const hAppend = (l: Box, r: Box): Box => hcat(top, [l, r]);

// Paste two boxes together horizontally with a single intervening column of space.
// (<+>) :: Box -> Box -> Box
export const hcatWithSpace = (l: Box, r: Box): Box =>
  hcat(top, [l, emptyBox(0, 1), r]);

// Paste two boxes together vertically.
// (//) :: Box -> Box -> Box
export const vAppend = (t: Box, b: Box): Box => vcat(left, [t, b]);

// Paste two boxes together vertically with a single intervening row of space.
// (/+/) :: Box -> Box -> Box
export const vcatWithSpace = (t: Box, b: Box): Box =>
  vcat(left, [t, emptyBox(1, 0), b]);

// @punctuateH a p bs@ horizontally lays out the boxes @bs@ with a copy of @p@ interspersed between each.
// punctuateH :: Foldable f => Alignment -> Box -> f Box -> Box
export const punctuateH = (a: Alignment, p: Box, bs: readonly Box[]): Box => {
  if (bs.length === 0) {
    return nullBox;
  }
  return hcat(a, Array.intersperse(bs, p));
};

// A vertical version of 'punctuateH'.
// punctuateV :: Foldable f => Alignment -> Box -> f Box -> Box
export const punctuateV = (a: Alignment, p: Box, bs: readonly Box[]): Box => {
  if (bs.length === 0) {
    return nullBox;
  }
  return vcat(a, Array.intersperse(bs, p));
};

// @hsep sep a bs@ lays out @bs@ horizontally with alignment @a@, with @sep@ amount of space in between each.
// hsep :: Foldable f => Int -> Alignment -> f Box -> Box
export const hsep = (sep: number, a: Alignment, bs: readonly Box[]): Box =>
  punctuateH(a, emptyBox(0, sep), bs);

// @vsep sep a bs@ lays out @bs@ vertically with alignment @a@, with @sep@ amount of space in between each.
// vsep :: Foldable f => Int -> Alignment -> f Box -> Box
export const vsep = (sep: number, a: Alignment, bs: readonly Box[]): Box =>
  punctuateV(a, emptyBox(sep, 0), bs);

/*
 *  --------------------------------------------------------------------------------
 *  --  Paragraph flowing  ---------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

// data ParaContent = Block { _fullLines :: [Line]
//                          , _lastLine  :: Line
//                          }
const ParaContent = Schema.Struct({
  fullLines: Schema.Array(Schema.Array(Schema.NonEmptyString)),
  lastLine: Schema.Array(Schema.NonEmptyString),
});

// data Para = Para { _paraWidth   :: Int
//                  , _paraContent :: ParaContent
//                  }
const Para = Schema.Struct({
  width: Schema.Number,
  content: ParaContent,
});
type Para = typeof Para.Type;

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
export const columns = (a: Alignment, w: number, h: number, t: string): Box[] =>
  pipe(
    flow(w, t),
    Array.chunksOf(h),
    Array.map((chunk) => mkParaBox(a, h, chunk))
  );

// @mkParaBox a n s@ makes a box of height @n@ with the text @s@ aligned according to @a@.
// mkParaBox :: Alignment -> Int -> [String] -> Box
const mkParaBox = (a: Alignment, n: number, s: string[]): Box => {
  if (s.length === 0) {
    return emptyBox(n, 0);
  }
  const textBoxes = s.map((line) => text(line));
  const combinedBox = vcat(a, textBoxes);
  return alignVert(top, n, combinedBox);
};

// Flow the given text into the given width.
// flow :: Int -> String -> [String]
const flow = (width: number, text: string): string[] => {
  if (text.trim() === "") {
    return [""];
  }

  return pipe(
    text,
    String.split(whitespaceRegex),
    Array.filter((word) => word.length > 0),
    Array.reduce(emptyPara(width), (para, word) => addWordP(word)(para)),
    getLines,
    Array.map((line) => line.slice(0, width))
  );
};

// getLines :: Para -> [String]
const getLines = ({
  content: { fullLines, lastLine },
}: typeof Para.Type): string[] => {
  const process = (lines: readonly (readonly string[])[]): string[] =>
    pipe(
      Array.fromIterable(lines),
      Array.reverse,
      Array.map((line) => pipe(line, Array.reverse, Array.join(" ")))
    );

  return process(lastLine.length === 0 ? fullLines : [lastLine, ...fullLines]);
};

// addWordP :: Para -> Word -> Para
const addWordP =
  (word: string) =>
  (para: Para): Para => {
    return {
      width: para.width,
      content: wordFits(para, word)
        ? {
            fullLines: para.content.fullLines,
            lastLine: [word, ...para.content.lastLine],
          }
        : {
            fullLines:
              para.content.lastLine.length === 0
                ? para.content.fullLines
                : [para.content.lastLine, ...para.content.fullLines],
            lastLine: [word],
          },
    };
  };

// wordFits :: Int -> Word -> Line -> Bool
const wordFits = (
  { content: paraContent, width: paraWidth }: typeof Para.Type,
  word: string
): boolean => {
  if (line.length === 0) {
    return word.length <= paraWidth;
  }
  const currentLength = paraContent.lastLine.reduce(
    (acc, w) => acc + w.length,
    line.length - 1
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
export const alignHoriz = (a: Alignment, c: number, b: Box): Box =>
  align(a, "AlignFirst", b.rows, c, b);

// @alignVert algn n bx@ creates a box of height @n@, with the contents and width of @bx@, vertically aligned according to @algn@.
// alignVert :: Alignment -> Int -> Box -> Box
export const alignVert = (a: Alignment, r: number, b: Box): Box =>
  align("AlignFirst", a, r, b.cols, b);

// @align ah av r c bx@ creates an @r@ x @c@ box with the contents of @bx@, aligned horizontally according to @ah@ and vertically according to @av@.
// align :: Alignment -> Alignment -> Int -> Int -> Box -> Box
export const align = (
  ah: Alignment,
  av: Alignment,
  r: number,
  c: number,
  b: Box
): Box => ({
  rows: r,
  cols: c,
  content: { _tag: "SubBox", xAlign: ah, yAlign: av, box: b },
});

// Move a box "up" by putting it in a larger box with extra rows, aligned to the top.
// moveUp :: Int -> Box -> Box
export const moveUp = (n: number, b: Box): Box => alignVert(top, b.rows + n, b);

// Move a box down by putting it in a larger box with extra rows, aligned to the bottom.
// moveDown :: Int -> Box -> Box
export const moveDown = (n: number, b: Box): Box =>
  alignVert(bottom, b.rows + n, b);

// Move a box left by putting it in a larger box with extra columns, aligned left.
// moveLeft :: Int -> Box -> Box
export const moveLeft = (n: number, b: Box): Box =>
  alignHoriz(left, b.cols + n, b);

// Move a box right by putting it in a larger box with extra columns, aligned right.
// moveRight :: Int -> Box -> Box
export const moveRight = (n: number, b: Box): Box =>
  alignHoriz(right, b.cols + n, b);

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
          merge(boxes.map((box) => renderBoxWithRows(rows, box)))
        )
      ),
      Match.tag("Col", ({ boxes }) =>
        resizeBox(
          rows,
          cols,
          boxes.flatMap((box) => renderBoxWithCols(cols, box))
        )
      ),
      Match.tag("SubBox", ({ box, xAlign, yAlign }) =>
        resizeBoxAligned(rows, cols, xAlign, yAlign, renderBox(box))
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

// A convenience function for rendering a box to stdout.
// printBox :: Box -> IO ()
export const printBox = (b: Box) =>
  Effect.gen(function* () {
    yield* Console.log(render(b));
  });
