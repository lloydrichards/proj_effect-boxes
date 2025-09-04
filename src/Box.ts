import { Array, Match, pipe, Schema, String } from "effect";

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
export const Content = Schema.Union(
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
export type Content = typeof Content.Type;

// The basic data type.  A box has a specified size and some sort of contents.
export class Box extends Schema.Class<Box>("Box")({
  rows: Schema.Number,
  cols: Schema.Number,
  content: Content,
}) {
  // The null box, which has no content and no size.  It is quite useless.
  // nullBox :: Box
  static null: Box = { rows: 0, cols: 0, content: { _tag: "Blank" } };

  // @empty r c@ is an empty box with @r@ rows and @c@ columns.
  // empty :: Int -> Int -> Box
  static empty = (rows: number, cols: number): Box => ({
    rows: Math.max(0, rows),
    cols: Math.max(0, cols),
    content: { _tag: "Blank" },
  });

  // A @1x1@ box containing a single character.
  // char :: Char -> Box
  static char = (c: string): Box => ({
    rows: 1,
    cols: 1,
    content: { _tag: "Text", text: c[0] ?? " " },
  });

  // unsafeLine :: String -> Box
  static unsafeLine = (t: string): Box => ({
    rows: 1,
    cols: t.length,
    content: { _tag: "Text", text: t },
  });

  // A box containing lines of text.
  // text :: String -> Box
  static text = (s: string): Box =>
    vcat(
      left,
      String.split(s, "\n").map((l) => Box.unsafeLine(l))
    );

  // A (@1 x len@) box containing a string length @len@
  // line :: String -> Box
  static line = (s: string): Box =>
    Box.unsafeLine(String.replace(/\n|\r/g, "")(s));

  // @para algn w t@ is a box of width @w@, containing text @t@, aligned according to @algn@, flowed to fit within the given width.
  // para :: Alignment -> Int -> String -> Box
  static para = (a: Alignment, w: number, t: string): Box => {
    const lines = flow(w, t);
    return mkParaBox(a, lines.length, lines);
  };

  // Semigroup instance for Box
  // instance Semigroup Box where
  //     l <> r = hcat top [l,r]
  static combine = (l: Box, r: Box): Box => hcat(top, [l, r]);
  static combineMany = (start: Box, collection: Iterable<Box>): Box =>
    hcat(top, [start, ...Array.fromIterable(collection)]);

  // Monoid instance for Box (extends Semigroup with empty element)
  // instance Monoid Box where
  //     mempty = nullBox
  //     mappend = (<>)
  //     mconcat = hcat top
  static combineAll = (collection: Iterable<Box>): Box => {
    const boxes = Array.fromIterable(collection);
    return boxes.length === 0 ? Box.null : hcat(top, boxes);
  };
}

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
  hcat(top, [l, Box.empty(0, 1), r]);

// Paste two boxes together vertically.
// (//) :: Box -> Box -> Box
export const vAppend = (t: Box, b: Box): Box => vcat(left, [t, b]);

// Paste two boxes together vertically with a single intervening row of space.
// (/+/) :: Box -> Box -> Box
export const vcatWithSpace = (t: Box, b: Box): Box =>
  vcat(left, [t, Box.empty(1, 0), b]);

// @punctuateH a p bs@ horizontally lays out the boxes @bs@ with a copy of @p@ interspersed between each.
// punctuateH :: Foldable f => Alignment -> Box -> f Box -> Box
export const punctuateH = (a: Alignment, p: Box, bs: readonly Box[]): Box => {
  if (bs.length === 0) {
    return Box.null;
  }
  const interspersed: Box[] = [];
  for (let i = 0; i < bs.length; i++) {
    const box = bs[i];
    if (box) {
      interspersed.push(box);
      if (i < bs.length - 1) {
        interspersed.push(p);
      }
    }
  }
  return hcat(a, interspersed);
};

// A vertical version of 'punctuateH'.
// punctuateV :: Foldable f => Alignment -> Box -> f Box -> Box
export const punctuateV = (a: Alignment, p: Box, bs: readonly Box[]): Box => {
  if (bs.length === 0) {
    return Box.null;
  }
  const interspersed: Box[] = [];
  for (let i = 0; i < bs.length; i++) {
    const box = bs[i];
    if (box) {
      interspersed.push(box);
      if (i < bs.length - 1) {
        interspersed.push(p);
      }
    }
  }
  return vcat(a, interspersed);
};

// @hsep sep a bs@ lays out @bs@ horizontally with alignment @a@, with @sep@ amount of space in between each.
// hsep :: Foldable f => Int -> Alignment -> f Box -> Box
export const hsep = (sep: number, a: Alignment, bs: readonly Box[]): Box =>
  punctuateH(a, Box.empty(0, sep), bs);

// @vsep sep a bs@ lays out @bs@ vertically with alignment @a@, with @sep@ amount of space in between each.
// vsep :: Foldable f => Int -> Alignment -> f Box -> Box
export const vsep = (sep: number, a: Alignment, bs: readonly Box[]): Box =>
  punctuateV(a, Box.empty(sep, 0), bs);

/*
 *  --------------------------------------------------------------------------------
 *  --  Paragraph flowing  ---------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

// data Word = Word { wLen :: Int, getWord  :: String }
export class Word extends Schema.Class<Word>("Word")({
  wLen: Schema.Number,
  getWord: Schema.String,
}) {
  // mkWord :: String -> Word
  static fromString(word: string): Word {
    return {
      wLen: word.length,
      getWord: word,
    };
  }
}

// data Line = Line { lLen :: Int, getWords :: [Word] }
export class Line extends Schema.Class<Line>("Line")({
  lLen: Schema.Number,
  getWords: Schema.Array(Word),
}) {
  // mkLine :: [Word] -> Line
  static fromWords = (words: Word[]): Line => ({
    lLen: words.reduce((acc, w) => acc + w.wLen, Math.max(0, words.length - 1)),
    getWords: words,
  });
}

// data ParaContent = Block { _fullLines :: [Line]
//                          , _lastLine  :: Line
//                          }
export class ParaContent extends Schema.Class<ParaContent>("ParaContent")({
  fullLines: Schema.Array(Line),
  lastLine: Line,
}) {
  static empty: ParaContent = {
    fullLines: [],
    lastLine: {
      lLen: 0,
      getWords: [],
    },
  };
}

// data Para = Para { _paraWidth   :: Int
//                  , _paraContent :: ParaContent
//                  }
export class Para extends Schema.Class<Para>("Para")({
  paraWidth: Schema.Number,
  paraContent: ParaContent,
}) {
  // emptyPara :: Int -> Para
  static empty = (paraWidth: number): Para => ({
    paraWidth,
    paraContent: ParaContent.empty,
  });
}

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
export const mkParaBox = (a: Alignment, n: number, s: string[]): Box => {
  if (s.length === 0) {
    return Box.empty(n, 0);
  }
  const textBoxes = s.map((line) => Box.text(line));
  const combinedBox = vcat(a, textBoxes);
  return alignVert(top, n, combinedBox);
};

// Flow the given text into the given width.
// flow :: Int -> String -> [String]
export const flow = (width: number, text: string): string[] => {
  if (text.trim() === "") {
    return [""];
  }

  return pipe(
    text,
    String.split(whitespaceRegex),
    Array.filter((word) => word.length > 0),
    Array.map(Word.fromString),
    Array.reduce(Para.empty(width), (para, word) => addWordP(word)(para)),
    getLines,
    Array.map((line) => line.slice(0, width))
  );
};

// getLines :: Para -> [String]
export const getLines = ({
  paraContent: { fullLines, lastLine },
}: typeof Para.Type): string[] => {
  const process = (lines: readonly Line[]): string[] =>
    pipe(
      Array.fromIterable(lines),
      Array.reverse,
      Array.map((line) =>
        pipe(
          line.getWords,
          Array.reverse,
          Array.map((word) => word.getWord),
          Array.join(" ")
        )
      )
    );

  return process(lastLine.lLen === 0 ? fullLines : [lastLine, ...fullLines]);
};

// startLine :: Word -> Line
export const startLine = (word: Word): Line => ({
  lLen: word.wLen,
  getWords: [word],
});

// addWordP :: Para -> Word -> Para
export const addWordP =
  (word: Word) =>
  (para: Para): Para =>
    wordFits(para.paraWidth, word, para.paraContent.lastLine)
      ? {
          paraWidth: para.paraWidth,
          paraContent: {
            fullLines: para.paraContent.fullLines,
            lastLine: addWordL(word)(para.paraContent.lastLine),
          },
        }
      : {
          paraWidth: para.paraWidth,
          paraContent: {
            fullLines: [
              para.paraContent.lastLine,
              ...para.paraContent.fullLines,
            ],
            lastLine: startLine(word),
          },
        };

// addWordL :: Word -> Line -> Line
const addWordL =
  (word: Word) =>
  (line: Line): Line => ({
    lLen: line.lLen + word.wLen + 1,
    getWords: [word, ...line.getWords],
  });

// wordFits :: Int -> Word -> Line -> Bool
const wordFits = (paraWidth: number, word: Word, line: Line): boolean =>
  line.lLen === 0 || line.lLen + word.wLen + 1 <= paraWidth;

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
const renderBox = (b: Box): string[] => {
  if (b.rows === 0 || b.cols === 0) {
    return [];
  }

  return pipe(
    b.content,
    Match.type<Content>().pipe(
      Match.tag("Blank", () => resizeBox(b.rows, b.cols, [""])),
      Match.tag("Text", (content) => resizeBox(b.rows, b.cols, [content.text])),
      Match.tag("Row", (content) =>
        resizeBox(
          b.rows,
          b.cols,
          merge(content.boxes.map((box) => renderBoxWithRows(b.rows, box)))
        )
      ),
      Match.tag("Col", (content) =>
        resizeBox(
          b.rows,
          b.cols,
          content.boxes.flatMap((box) => renderBoxWithCols(b.cols, box))
        )
      ),
      Match.tag("SubBox", (content) =>
        resizeBoxAligned(
          b.rows,
          b.cols,
          content.xAlign,
          content.yAlign,
          renderBox(content.box)
        )
      ),
      Match.exhaustive
    )
  );
};

const trailingSpaceRegex = /\s+$/;

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

//  "Padded take": @takeP a n xs@ is the same as @take n xs@, if @n <= length xs@; otherwise it is @xs@ followed by enough copies of @a@ to make the length equal to @n@.
// takeP :: a -> Int -> [a] -> [a]
export const takeP = <A>(a: A, n: number, xs: readonly A[]): A[] => {
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
export const takePA = <A>(
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
export const blanks = (n: number): string =>
  pipe(" ", String.repeat(Math.max(0, n)));

// Render a box as a list of lines, using a given number of rows.
// renderBoxWithRows :: Int -> Box -> [String]
export const renderBoxWithRows = (r: number, b: Box): string[] =>
  renderBox({ ...b, rows: r });

// Render a box as a list of lines, using a given number of columns.
// renderBoxWithCols :: Int -> Box -> [String]
export const renderBoxWithCols = (c: number, b: Box): string[] =>
  renderBox({ ...b, cols: c });

// Resize a rendered list of lines.
// resizeBox :: Int -> Int -> [String] -> [String]
export const resizeBox = (r: number, c: number, lines: string[]): string[] =>
  takeP(
    blanks(c),
    r,
    lines.map((line) => takeP(" ", c, [...line])).map((chars) => chars.join(""))
  );

// Resize a rendered list of lines, using given alignments.
// resizeBoxAligned :: Int -> Int -> Alignment -> Alignment -> [String] -> [String]
export const resizeBoxAligned = (
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

// A convenience function for rendering a box to stdout.
// printBox :: Box -> IO ()
export const printBox = (b: Box): void => {
  // Using console.log is the closest equivalent to putStr in browser/Node environment
  // biome-ignore lint/suspicious/noConsole: This is intentionally a print function
  console.log(render(b));
};
