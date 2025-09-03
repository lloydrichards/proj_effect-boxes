import { Array, Schema, String } from "effect";

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

// @para algn w t@ is a box of width @w@, containing text @t@, aligned according to @algn@, flowed to fit within the given width.
// para :: Alignment -> Int -> String -> Box
// TODO: implement para

// @columns w h t@ is a list of boxes, each of width @w@ and height at most @h@, containing text @t@ flowed into as many columns as necessary.
// columns :: Alignment -> Int -> Int -> String -> [Box]
// TODO: implement columns

// @mkParaBox a n s@ makes a box of height @n@ with the text @s@ aligned according to @a@.
// mkParaBox :: Alignment -> Int -> [String] -> Box
// TODO: implement mkParaBox

// Flow the given text into the given width.
// flow :: Int -> String -> [String]
// TODO: implement flow

// data Para = Para { _paraWidth   :: Int
//                  , _paraContent :: ParaContent
//                  }
// TODO: implement Para

// data ParaContent = Block { _fullLines :: [Line]
//                          , _lastLine  :: Line
//                          }
// TODO: implement ParaContent

// emptyPara :: Int -> Para
// TODO: implement emptyPara

// getLines :: Para -> [String]
// TODO: implement getLines

// data Line = Line { lLen :: Int, getWords :: [Word] }
// TODO: implement Line

// mkLine :: [Word] -> Line
// TODO: implement mkLine

// startLine :: Word -> Line
// TODO: implement startLine

// data Word = Word { wLen :: Int, getWord  :: String }
// TODO: implement Word

// mkWord :: String -> Word
// TODO: implement mkWord

// addWordP :: Para -> Word -> Para
// TODO: implement addWordP

// addWordL :: Word -> Line -> Line
// TODO: implement addWordL

// wordFits :: Int -> Word -> Line -> Bool
// TODO: implement wordFits
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

const getPadding = (
  total: number,
  sub: number,
  alignment: Alignment
): [number, number] => {
  const empty = total - sub;
  let before: number;
  switch (alignment) {
    case "AlignFirst":
      before = 0;
      break;
    case "AlignLast":
      before = empty;
      break;
    case "AlignCenter1":
      before = Math.ceil(empty / 2);
      break;
    case "AlignCenter2":
      before = Math.floor(empty / 2);
      break;
  }
  const after = empty - before;
  return [before, after];
};

const renderBoxContent = (
  content: Content,
  rows: number,
  cols: number
): string[] => {
  switch (content._tag) {
    case "Blank":
      return Array.makeBy(rows, () => String.repeat(cols)(" "));
    case "Text":
      return [content.text + String.repeat(cols - content.text.length)(" ")];
    case "Row": {
      const rendered = content.boxes.map(renderBox);
      const result: string[] = Array.makeBy(rows, () => "");
      for (let r = 0; r < rows; r++) {
        for (const c of rendered) {
          result[r] += c[r] ?? "";
        }
      }
      return result;
    }
    case "Col": {
      const result: string[] = [];
      for (const c of content.boxes) {
        result.push(...renderBox(c));
      }
      return result;
    }
    case "SubBox": {
      const sub = renderBox(content.box);
      const [topPad, bottomPad] = getPadding(
        rows,
        content.box.rows,
        content.yAlign
      );
      const [leftPad, rightPad] = getPadding(
        cols,
        content.box.cols,
        content.xAlign
      );

      const result: string[] = [];
      for (let i = 0; i < topPad; i++) {
        result.push(String.repeat(cols)(" "));
      }
      for (const line of sub) {
        result.push(
          String.repeat(leftPad)(" ") + line + String.repeat(rightPad)(" ")
        );
      }
      for (let i = 0; i < bottomPad; i++) {
        result.push(String.repeat(cols)(" "));
      }
      return result;
    }
  }
};

// Render a box as a list of lines.
// renderBox :: Box -> [String]
const renderBox = (b: Box): string[] => {
  if (b.rows === 0 || b.cols === 0) {
    return [];
  }
  return renderBoxContent(b.content, b.rows, b.cols);
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

// dropWhileEnd :: (a -> Bool) -> [a] -> [a]
// TODO: implement dropWhileEnd

// Generate a string of spaces.
// blanks :: Int -> String
// TODO: implement blanks

// Render a box as a list of lines, using a given number of rows.
// renderBoxWithRows :: Int -> Box -> [String]
// TODO: implement renderBoxWithRows

// Render a box as a list of lines, using a given number of columns.
// renderBoxWithCols :: Int -> Box -> [String]
// TODO: implement renderBoxWithCols

// Resize a rendered list of lines.
// resizeBox :: Int -> Int -> [String] -> [String]
// TODO: implement resizeBox

// Resize a rendered list of lines, using given alignments.
// resizeBoxAligned :: Int -> Int -> Alignment -> Alignment -> [String] -> [String]
// TODO: implement resizeBoxAligned

// A convenience function for rendering a box to stdout.
// printBox :: Box -> IO ()
// TODO: implement printBox
