import type { Effect } from "effect";
import type * as Equal from "effect/Equal";
import type * as Hash from "effect/Hash";
import type * as Inspectable from "effect/Inspectable";
import type { Pipeable } from "effect/Pipeable";
import type { Annotation } from "./Annotation";
import * as internal from "./internal/box";
import type * as Renderer from "./Renderer";

export const BoxTypeId: unique symbol = internal.BoxTypeId;

/**
 *
 */
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
export const top: Alignment = internal.top;

/**
 * Align boxes along their bottoms.
 */
export const bottom: Alignment = internal.bottom;

/**
 * Align boxes to the left.
 */
export const left: Alignment = internal.left;

/**
 * Align boxes to the right.
 */
export const right: Alignment = internal.right;

/**
 * Align boxes centered, but biased to the left/top in case of unequal parities.
 */
export const center1: Alignment = internal.center1;

/**
 * Align boxes centered, but biased to the right/bottom in case of unequal parities.
 */
export const center2: Alignment = internal.center2;

/**
 * Contents of a box.
 */
export type Blank = { _tag: "Blank" };
export type Text = { _tag: "Text"; text: string };
export type Row<A = never> = { _tag: "Row"; boxes: Box<A>[] };
export type Col<A = never> = { _tag: "Col"; boxes: Box<A>[] };
export type SubBox<A = never> = {
  _tag: "SubBox";
  xAlign: Alignment;
  yAlign: Alignment;
  box: Box<A>;
};

export type Content<A = never> = Blank | Text | Row<A> | Col<A> | SubBox<A>;

export type BoxAnnotations<T extends readonly unknown[]> = T extends readonly [
  infer Head,
  ...infer Tail,
]
  ? Head extends Box<infer A>
    ? A | BoxAnnotations<Tail>
    : never
  : never;

/**
 * The Box data type, representing a rectangular area of text with various combinators for layout and alignment.
 */
export interface Box<A = never>
  extends Pipeable,
    Equal.Equal,
    Hash.Hash,
    Inspectable.Inspectable {
  readonly [BoxTypeId]: BoxTypeId;
  readonly rows: number;
  readonly cols: number;
  readonly content: Content<A>;
  readonly annotation?: Annotation<A>;
}

// -----------------------------------------------------------------------------
// Refinements
// -----------------------------------------------------------------------------

export const isBox: <A>(u: unknown) => u is Box<A> = internal.isBox;

// -----------------------------------------------------------------------------
// Constructors
// -----------------------------------------------------------------------------

/**
 * Creates an empty box with no content.
 *
 * @note Haskell: `nullBox :: Box`
 */
export const nullBox: Box<never> = internal.nullBox;

/**
 * Creates an empty box with the specified dimensions.
 * @param rows - The number of rows for the box
 * @param cols - The number of columns for the box
 *
 * @note Haskell: `empty :: Int -> Int -> Box`
 */
export const emptyBox: (rows?: number, cols?: number) => Box<never> =
  internal.emptyBox;

/**
 * Creates a 1x1 box containing a single character.
 * @param c - The character to place in the box (uses first character if string is longer)
 *
 * @note Haskell: `char :: Char -> Box`
 */
export const char: (c: string) => Box<never> = internal.char;

/**
 * Creates a box containing multi-line text, splitting on newlines.
 * @param s - The text string, which may contain newline characters
 *
 * @note Haskell: `text :: String -> Box`
 */
export const text: (s: string) => Box<never> = internal.text;

/**
 * Creates a single-line box from a string, removing any line breaks.
 * @param s - The text string (line breaks will be stripped)
 *
 * @note Haskell: `line :: String -> Box`
 */
export const line: (s: string) => Box<never> = internal.line;

/**
 * Creates a paragraph box with text flowed to fit within the specified width.
 * @param self - The text to flow into a paragraph
 * @param a - The alignment for the text within the box
 * @param w - The maximum width for the paragraph
 *
 * @note Haskell: `para :: Alignment -> Int -> String -> Box`
 */
export const para: {
  (a: Alignment, w: number): (self: string) => Box<never>;
  (self: string, a: Alignment, w: number): Box<never>;
} = internal.para;

/**
 * Combines two boxes horizontally using the Semigroup instance.
 * @param self - The first box
 * @param l - The second box to combine with the first
 *
 * @note Haskell: `instance Semigroup Box where l <> r = hcat top [l,r]`
 */
export const combine: {
  <B>(l: Box<B>): <A>(self: Box<A>) => Box<A | B>;
  <A, B>(self: Box<A>, l: Box<B>): Box<A | B>;
} = internal.combine;

export const combineMany: {
  <A>(start: Box<A>): <B>(self: Iterable<Box<B>>) => Box<A | B>;
  <A, B>(self: Iterable<Box<B>>, start: Box<A>): Box<A | B>;
} = internal.combineMany;

/**
 * Combines all boxes in a collection horizontally, returning nullBox if empty.
 * @param collection - The collection of boxes to combine
 *
 * @note Haskell: `instance Monoid Box where mempty = nullBox mappend = (<>) mconcat = hcat top`
 */
export const combineAll: <T extends readonly Box<unknown>[]>(
  collection: T
) => Box<BoxAnnotations<T>> = internal.combineAll;

/**
 * Gets the number of rows in a box.
 * @param b - The box to measure
 *
 * @note Haskell: `rows :: Box -> Int`
 */
export const rows: <A>(b: Box<A>) => number = internal.rows;

/**
 * Gets the number of columns in a box.
 * @param b - The box to measure
 *
 * @note Haskell: `cols :: Box -> Int`
 */
export const cols: <A>(b: Box<A>) => number = internal.cols;

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

/**
 * Creates a box with the specified dimensions and content.
 */
export const make: <A>(b: {
  rows: number;
  cols: number;
  content: Content<A>;
  annotation?: Annotation<A>;
}) => Box<A> = internal.make;

/**
 * Pattern matching utility for Box content.
 */
export const match: {
  <A, R>(patterns: {
    readonly blank: () => R;
    readonly text: (text: string) => R;
    readonly row: (boxes: Box<A>[]) => R;
    readonly col: (boxes: Box<A>[]) => R;
    readonly subBox: (box: Box<A>, xAlign: Alignment, yAlign: Alignment) => R;
  }): (self: Box<A>) => R;
  <A, R>(
    self: Box<A>,
    patterns: {
      readonly blank: () => R;
      readonly text: (text: string) => R;
      readonly row: (boxes: Box<A>[]) => R;
      readonly col: (boxes: Box<A>[]) => R;
      readonly subBox: (box: Box<A>, xAlign: Alignment, yAlign: Alignment) => R;
    }
  ): R;
} = internal.match;

/**
 * Arranges boxes horizontally in a row with the specified alignment.
 * @param self - Array of boxes to arrange horizontally
 * @param a - Vertical alignment of boxes within the row
 *
 * @note Haskell: `hcat :: Foldable f => Alignment -> f Box -> Box`
 */
export const hcat: {
  <T extends readonly Box<unknown>[]>(
    a: Alignment
  ): (self: T) => Box<BoxAnnotations<T>>;
  <T extends readonly Box<unknown>[]>(
    self: T,
    a: Alignment
  ): Box<BoxAnnotations<T>>;
} = internal.hcat;

/**
 * Arranges boxes vertically in a column with the specified alignment.
 * @param self - Array of boxes to arrange vertically
 * @param a - Horizontal alignment of boxes within the column
 *
 * @note Haskell: `vcat :: Foldable f => Alignment -> f Box -> Box`
 */
export const vcat: {
  <T extends readonly Box<unknown>[]>(
    a: Alignment
  ): (self: T) => Box<BoxAnnotations<T>>;
  <T extends readonly Box<unknown>[]>(
    self: T,
    a: Alignment
  ): Box<BoxAnnotations<T>>;
} = internal.vcat;

/**
 * Places two boxes side by side horizontally.
 * @param self - The first box
 * @param l - The second box to place to the right
 *
 * @note Haskell: `instance Semigroup Box where l <> r = hcat top [l,r]`
 */
export const hAppend: {
  <A>(l: Box<A>): (self: Box<A>) => Box<A>;
  <A>(self: Box<A>, l: Box<A>): Box<A>;
} = internal.hAppend;

/**
 * Places two boxes side by side with a single space column between them.
 * @param self - The first box
 * @param l - The second box to place to the right
 *
 * @note Haskell: `(<+>) :: Box -> Box -> Box`
 */
export const hcatWithSpace: {
  <A>(l: Box<A>): (self: Box<A>) => Box<A>;
  <A>(self: Box<A>, l: Box<A>): Box<A>;
} = internal.hcatWithSpace;

/**
 * Stacks two boxes vertically, one above the other.
 * @param self - The top box
 * @param t - The bottom box
 *
 * @note Haskell: `(//) :: Box -> Box -> Box`
 */
export const vAppend: {
  <A>(t: Box<A>): (self: Box<A>) => Box<A>;
  <A>(self: Box<A>, t: Box<A>): Box<A>;
} = internal.vAppend;

/**
 * Stacks two boxes vertically with a single empty row between them.
 * @param self - The top box
 * @param t - The bottom box
 *
 * @note Haskell: `(/+/) :: Box -> Box -> Box`
 */
export const vcatWithSpace: {
  <A>(t: Box<A>): (self: Box<A>) => Box<A>;
  <A>(self: Box<A>, t: Box<A>): Box<A>;
} = internal.vcatWithSpace;

/**
 * Arranges boxes horizontally with a separator box placed between each pair.
 * @param self - Array of boxes to arrange
 * @param a - Vertical alignment for the arrangement
 * @param p - Separator box to place between each pair of boxes
 *
 * @note Haskell: `punctuateH :: Foldable f => Alignment -> Box -> f Box -> Box`
 */
export const punctuateH: {
  <A, T extends readonly Box<unknown>[]>(
    a: Alignment,
    p: Box<A>
  ): (self: T) => Box<A | BoxAnnotations<T>>;
  <A, T extends readonly Box<unknown>[]>(
    self: T,
    a: Alignment,
    p: Box<A>
  ): Box<A | BoxAnnotations<T>>;
} = internal.punctuateH;

/**
 * Arranges boxes vertically with a separator box placed between each pair.
 * @param self - Array of boxes to arrange
 * @param a - Horizontal alignment for the arrangement
 * @param p - Separator box to place between each pair of boxes
 *
 * @note Haskell: `punctuateV :: Foldable f => Alignment -> Box -> f Box -> Box`
 */
export const punctuateV: {
  <A, T extends readonly Box<unknown>[]>(
    a: Alignment,
    p: Box<A>
  ): (self: T) => Box<A | BoxAnnotations<T>>;
  <A, T extends readonly Box<unknown>[]>(
    self: T,
    a: Alignment,
    p: Box<A>
  ): Box<A | BoxAnnotations<T>>;
} = internal.punctuateV;

/**
 * Arranges boxes horizontally with the specified amount of space between each.
 * @param self - Array of boxes to arrange
 * @param sep - Number of spaces to place between boxes
 * @param a - Vertical alignment for the arrangement
 *
 * @note Haskell: `hsep :: Foldable f => Int -> Alignment -> f Box -> Box`
 */
export const hsep: {
  (sep: number, a: Alignment): <A>(self: readonly Box<A>[]) => Box<A>;
  <A>(self: readonly Box<A>[], sep: number, a: Alignment): Box<A>;
} = internal.hsep;

/**
 * Arranges boxes vertically with the specified amount of space between each.
 * @param self - Array of boxes to arrange
 * @param sep - Number of empty rows to place between boxes
 * @param a - Horizontal alignment for the arrangement
 *
 * @note Haskell: `vsep :: Foldable f => Int -> Alignment -> f Box -> Box`
 */
export const vsep: {
  (sep: number, a: Alignment): <A>(self: readonly Box<A>[]) => Box<A>;
  <A>(self: readonly Box<A>[], sep: number, a: Alignment): Box<A>;
} = internal.vsep;

/*
 *  --------------------------------------------------------------------------------
 *  --  Paragraph flowing  ---------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Flows text into multiple columns of specified width and height.
 * @param self - The text to flow into columns
 * @param a - Alignment for text within each column
 * @param w - Width of each column
 * @param h - Maximum height of each column
 *
 * @note Haskell: `columns :: Alignment -> Int -> Int -> String -> [Box]`
 */
/**
 * Flows text into multiple columns of specified width and height.
 * @param self - The text to flow into columns
 * @param a - Alignment for text within each column
 * @param w - Width of each column
 * @param h - Maximum height of each column
 *
 * @note Haskell: `columns :: Alignment -> Int -> Int -> String -> [Box]`
 */
export const columns: {
  (a: Alignment, w: number, h: number): (self: string) => Box[];
  (self: string, a: Alignment, w: number, h: number): Box[];
} = internal.columns;

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
export const alignHoriz: {
  (a: Alignment, c: number): <A>(self: Box<A>) => Box<A>;
  <A>(self: Box<A>, a: Alignment, c: number): Box<A>;
} = internal.alignHoriz;

/**
 * Vertically aligns a box within a specified height.
 * @param self - The box to align
 * @param a - The vertical alignment
 * @param r - The target height
 *
 * @note Haskell: `alignVert :: Alignment -> Int -> Box -> Box`
 */
export const alignVert: {
  (a: Alignment, r: number): <A>(self: Box<A>) => Box<A>;
  <A>(self: Box<A>, a: Alignment, r: number): Box<A>;
} = internal.alignVert;

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
export const align: {
  (
    ah: Alignment,
    av: Alignment,
    r: number,
    c: number
  ): <A>(self: Box<A>) => Box<A>;
  <A>(self: Box<A>, ah: Alignment, av: Alignment, r: number, c: number): Box<A>;
} = internal.align;

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
export const alignLeft: <A>(self: Box<A>) => Box<A> = internal.alignLeft;

/**
 * Moves a box up by adding empty rows below it.
 * @param self - The box to move
 * @param n - Number of rows to add below
 *
 * @note Haskell: `moveUp :: Int -> Box -> Box`
 */
export const moveUp: {
  (n: number): <A>(self: Box<A>) => Box<A>;
  <A>(self: Box<A>, n: number): Box<A>;
} = internal.moveUp;

/**
 * Moves a box down by adding empty rows above it.
 * @param self - The box to move
 * @param n - Number of rows to add above
 *
 * @note Haskell: `moveDown :: Int -> Box -> Box`
 */
export const moveDown: {
  (n: number): <A>(self: Box<A>) => Box<A>;
  <A>(self: Box<A>, n: number): Box<A>;
} = internal.moveDown;

/**
 * Moves a box left by adding empty columns to the right.
 * @param self - The box to move
 * @param n - Number of columns to add to the right
 *
 * @note Haskell: `moveLeft :: Int -> Box -> Box`
 */
export const moveLeft: {
  (n: number): <A>(self: Box<A>) => Box<A>;
  <A>(self: Box<A>, n: number): Box<A>;
} = internal.moveLeft;

/**
 * Moves a box right by adding empty columns to the left.
 * @param self - The box to move
 * @param n - Number of columns to add to the left
 *
 * @note Haskell: `moveRight :: Int -> Box -> Box`
 */
export const moveRight: {
  (n: number): <A>(self: Box<A>) => Box<A>;
  <A>(self: Box<A>, n: number): Box<A>;
} = internal.moveRight;

/*
 *  --------------------------------------------------------------------------------
 *  --  Implementation  ------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Default render configuration for backwards compatibility (plain mode).
 */
export const defaultRenderConfig: Renderer.RenderStyle =
  internal.defaultRenderConfig;

/**
 * Merges multiple arrays of rendered text lines into a single array.
 * @param renderedBoxes - Arrays of text lines to merge
 *
 * @note Haskell: `merge = foldr (zipWith (++)) (repeat [])`
 */
export const merge: (renderedBoxes: string[][]) => string[] = internal.merge;

/**
 * Takes up to n elements from an array, padding with a default value if needed.
 * @param self - Source array
 * @param a - Default value to use for padding
 * @param n - Target length
 *
 * @note Haskell: `takeP :: a -> Int -> [a] -> [a]`
 */
export const takeP: {
  <A>(a: A, n: number): (self: readonly A[]) => A[];
  <A>(self: readonly A[], a: A, n: number): A[];
} = internal.takeP;

/**
 * Takes elements from an array with alignment, padding as needed.
 * @param self - Source array
 * @param alignment - How to align the original array within the result
 * @param a - Default value for padding
 * @param n - Target length
 *
 * @note Haskell: `takePA :: Alignment -> a -> Int -> [a] -> [a]`
 */
export const takePA: {
  <A>(alignment: Alignment, a: A, n: number): (self: readonly A[]) => A[];
  <A>(self: readonly A[], alignment: Alignment, a: A, n: number): A[];
} = internal.takePA;

/**
 * Creates a string of spaces with the specified length.
 * @param n - Number of spaces to generate
 *
 * @note Haskell: `blanks :: Int -> String`
 */
export const blanks: (n: number) => string = internal.blanks;

/**
 * Adjusts the size of rendered text lines to specific dimensions.
 * @param self - Text lines to resize
 * @param r - Target number of rows
 * @param c - Target number of columns
 *
 * @note Haskell: `resizeBox :: Int -> Int -> [String] -> [String]`
 */
export const resizeBox: {
  (r: number, c: number): (self: string[]) => string[];
  (self: string[], r: number, c: number): string[];
} = internal.resizeBox;

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
export const resizeBoxAligned: (
  r: number,
  c: number,
  ha: Alignment,
  va: Alignment
) => (self: string[]) => string[] = internal.resizeBoxAligned;

/**
 * Synchronous version of render() - converts a box to a string suitable for display.
 * This is an alias for render() provided for clarity that this is the non-Effect version.
 * @param self - The box to render
 * @param config - Optional render configuration (defaults to pretty style)
 *
 * @note Haskell: `render :: Box -> String`
 */
export const renderSync: {
  (config: Renderer.RenderStyle): <A>(self: Box<A>) => string;
  <A>(self: Box<A>, config: Renderer.RenderStyle): string;
} = internal.renderSync;

export const render: {
  <A>(
    config?: Renderer.RenderConfig | undefined
  ): (box: Box<A>) => Effect.Effect<string, never, Renderer.Renderer>;
  <A>(
    box: Box<A>,
    config?: Renderer.RenderConfig
  ): Effect.Effect<string, never, Renderer.Renderer>;
} = internal.render;
/**
 * Converts a box to a string while preserving all whitespace including trailing spaces.
 * @param self - The box to render
 *
 * @note Haskell: `renderWithSpaces :: Box -> String`
 */
export const renderWithSpaces: <A>(self: Box<A>) => string =
  internal.renderWithSpaces;

/**
 * Converts a box to a string using a custom separator instead of spaces.
 * @param self - The box to render
 * @param sep - Separator to use instead of spaces (default is a single space)
 */
export const renderWith: {
  (sep?: string): <A>(self: Box<A>) => string;
  <A>(self: Box<A>, sep?: string): string;
} = internal.renderWith;

/**
 * Prints a box to the console using the Effect Console.
 * @param b - The box to print
 *
 * @note Haskell: `printBox :: Box -> IO ()`
 */
export const printBox: <A>(
  b: Box<A>
) => Effect.Effect<void, never, Renderer.Renderer> = internal.printBox;

export const pretty: Renderer.RenderStyle = internal.pretty;
export const plain: Renderer.RenderStyle = internal.plain;

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
export const annotate: {
  <A>(annotation: Annotation<A>): <B>(self: Box<B>) => Box<A>;
  <B, A>(self: Box<B>, annotation: Annotation<A>): Box<A>;
} = internal.annotate;

/**
 * Removes the annotation from a box, returning a Box<never>.
 *
 * @param self - The box to remove annotation from
 */
export const unAnnotate: <A>(self: Box<A>) => Box<never> = internal.unAnnotate;

/**
 * Transforms the annotation of a box using a provided function.
 * If the box has no annotation, returns the box unchanged.
 *
 * @param self - The box with annotation to transform
 * @param transform - Function to transform the annotation
 */
export const reAnnotate: {
  <A, B>(transform: (annotation: A) => B): (self: Box<A>) => Box<B>;
  <A, B>(self: Box<A>, transform: (annotation: A) => B): Box<B>;
} = internal.reAnnotate;

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
export const alterAnnotations: {
  <A, B>(alter: (annotation: A) => B[]): (self: Box<A>) => Box<B>[];
  <A, B>(self: Box<A>, alter: (annotation: A) => B[]): Box<B>[];
} = internal.alterAnnotations;

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
export const alterAnnotate: {
  <A, B>(alter: (annotation: A) => B[]): (self: Box<A>) => Box<B>[];
  <A, B>(self: Box<A>, alter: (annotation: A) => B[]): Box<B>[];
} = internal.alterAnnotate;
