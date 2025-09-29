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
 * @category models
 */
export type BoxTypeId = typeof BoxTypeId;

/**
 * @category models
 */
export type Alignment =
  | "AlignFirst"
  | "AlignCenter1"
  | "AlignCenter2"
  | "AlignLast";

/**
 * Align boxes along their tops.
 *
 * @category constructors
 */
export const top: Alignment = internal.top;

/**
 * Align boxes along their bottoms.
 *
 * @category constructors
 */
export const bottom: Alignment = internal.bottom;

/**
 * Align boxes to the left.
 *
 * @category constructors
 */
export const left: Alignment = internal.left;

/**
 * Align boxes to the right.
 *
 * @category constructors
 */
export const right: Alignment = internal.right;

/**
 * Align boxes centered, but biased to the left/top in case of unequal parities.
 *
 * @category constructors
 */
export const center1: Alignment = internal.center1;

/**
 * Align boxes centered, but biased to the right/bottom in case of unequal parities.
 *
 * @category constructors
 */
export const center2: Alignment = internal.center2;

/**
 * @category models
 */
export type Blank = { _tag: "Blank" };

/**
 * @category models
 */
export type Text = { _tag: "Text"; text: string };

/**
 * @category models
 */
export type Row<A = never> = { _tag: "Row"; boxes: Box<A>[] };

/**
 * @category models
 */
export type Col<A = never> = { _tag: "Col"; boxes: Box<A>[] };

/**
 * @category models
 */
export type SubBox<A = never> = {
  _tag: "SubBox";
  xAlign: Alignment;
  yAlign: Alignment;
  box: Box<A>;
};

/**
 * @category models
 */
export type Content<A = never> = Blank | Text | Row<A> | Col<A> | SubBox<A>;

/**
 * @category models
 */
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
 *
 * @category models
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

/**
 * Type guard to determine if a value is a Box.
 *
 * @category guards
 */
export const isBox: <A>(u: unknown) => u is Box<A> = internal.isBox;

// -----------------------------------------------------------------------------
// Constructors
// -----------------------------------------------------------------------------

/**
 * Creates an empty box with no content.
 *
 * Serves as the identity element for Box combinations and the base
 * case for building more complex layouts.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const empty = Box.nullBox
 * console.log(`Dimensions: ${Box.rows(empty)} x ${Box.cols(empty)}`)
 * // Dimensions: 0 x 0
 * console.log(Box.render(empty))
 * // (empty string)
 * ```
 *
 * @note Haskell: `nullBox :: Box`
 * @category constructors
 */
export const nullBox: Box<never> = internal.nullBox;

/**
 * Creates an empty box with the specified dimensions.
 *
 * Useful for creating spacers or placeholders in layouts where you need
 * specific dimensions without visible content.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const spacer = Box.emptyBox(3, 10)
 * console.log(`Dimensions: ${Box.rows(spacer)} x ${Box.cols(spacer)}`)
 * // Dimensions: 3 x 10
 * console.log(Box.render(spacer))
 * //
 * //
 * //
 * ```
 *
 * @note Haskell: `empty :: Int -> Int -> Box`
 * @category constructors
 */
export const emptyBox: (rows?: number, cols?: number) => Box<never> =
  internal.emptyBox;

/**
 * Creates a 1x1 box containing a single character.
 *
 * If the string is longer than one character, only the first character
 * is used. Useful for creating single-character elements or borders.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const asterisk = Box.char("*")
 * console.log(`Dimensions: ${Box.rows(asterisk)} x ${Box.cols(asterisk)}`)
 * // Dimensions: 1 x 1
 * console.log(Box.render(asterisk))
 * // *
 *
 * const unicode = Box.char("🌟")
 * console.log(Box.render(unicode))
 * // 🌟
 * ```
 *
 * @note Haskell: `char :: Char -> Box`
 * @category constructors
 */
export const char: (c: string) => Box<never> = internal.char;

/**
 * Creates a box containing multi-line text, splitting on newlines.
 *
 * The most commonly used constructor for creating text-based boxes.
 * Automatically handles line breaks and calculates proper dimensions.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const greeting = Box.text("Hello\nWorld")
 * console.log(`Dimensions: ${Box.rows(greeting)} x ${Box.cols(greeting)}`)
 * // Dimensions: 2 x 5
 * console.log(Box.render(greeting))
 * // Hello
 * // World
 *
 * const singleLine = Box.text("Simple text")
 * console.log(`Dimensions: ${Box.rows(singleLine)} x ${Box.cols(singleLine)}`)
 * // Dimensions: 1 x 11
 * ```
 *
 * @note Haskell: `text :: String -> Box`
 * @category constructors
 */
export const text: (s: string) => Box<never> = internal.text;

/**
 * Creates a single-line box from a string, removing any line breaks.
 *
 * Forces the text onto a single line by replacing newlines with spaces.
 * Useful when you need to ensure text appears on one line regardless
 * of the input string's formatting.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const multilineInput = "Hello\nWorld\nExample"
 * const singleLine = Box.line(multilineInput)
 * console.log(`Dimensions: ${Box.rows(singleLine)} x ${Box.cols(singleLine)}`)
 * // Dimensions: 1 x 19
 * console.log(Box.render(singleLine))
 * // Hello World Example
 * ```
 *
 * @note Haskell: `line :: String -> Box`
 * @category constructors
 */
export const line: (s: string) => Box<never> = internal.line;

/**
 * Creates a paragraph box with text flowed to fit within the specified width.
 *
 * Breaks text into lines that fit within the given width, applying the
 * specified alignment to each line within the paragraph.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const longText = "This is a very long sentence that needs to be wrapped to fit within a specific width"
 * const paragraph = Box.para(longText, Box.left, 20)
 * console.log(Box.render(paragraph))
 * // This is a very long
 * // sentence that needs to
 * // be wrapped to fit
 * // within a specific
 * // width
 * ```
 *
 * @note Haskell: `para :: Alignment -> Int -> String -> Box`
 * @category constructors
 */
export const para: {
  (a: Alignment, w: number): (self: string) => Box<never>;
  (self: string, a: Alignment, w: number): Box<never>;
} = internal.para;

/**
 * Combines two boxes horizontally using the Semigroup instance.
 *
 * The fundamental combining operation that forms the basis of the Box
 * semigroup. Concatenates boxes horizontally with top alignment.
 *
 * **Mathematical Properties**
 * - **Associative**: `combine(combine(a, b), c) ≡ combine(a, combine(b, c))`
 * - **Identity**: `combine(nullBox, a) ≡ combine(a, nullBox) ≡ a`
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const left = Box.text("Hello")
 * const right = Box.text("World")
 * const combined = Box.combine(left, right)
 * console.log(Box.render(combined))
 * // HelloWorld
 * ```
 *
 * @note Haskell: `instance Semigroup Box where l <> r = hcat top [l,r]`
 * @category combinators
 */
export const combine: {
  <B>(l: Box<B>): <A>(self: Box<A>) => Box<A | B>;
  <A, B>(self: Box<A>, l: Box<B>): Box<A | B>;
} = internal.combine;

/**
 * Combines multiple boxes with a starting box using the Semigroup operation.
 *
 * @category combinators
 */
export const combineMany: {
  <A>(start: Box<A>): <B>(self: Iterable<Box<B>>) => Box<A | B>;
  <A, B>(self: Iterable<Box<B>>, start: Box<A>): Box<A | B>;
} = internal.combineMany;

/**
 * Combines all boxes in a collection horizontally, returning nullBox if empty.
 *
 * Implements the Monoid instance for Box, providing a way to combine
 * any number of boxes into a single horizontal layout.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const boxes = [Box.text("A"), Box.text("B"), Box.text("C")]
 * const combined = Box.combineAll(boxes)
 * console.log(Box.render(combined))
 * // ABC
 *
 * const empty = Box.combineAll([])
 * console.log(empty === Box.nullBox) // structural equality via Effect
 * ```
 *
 * @note Haskell: `instance Monoid Box where mempty = nullBox mappend = (<>) mconcat = hcat top`
 * @category combinators
 */
export const combineAll: <T extends readonly Box<unknown>[]>(
  collection: T
) => Box<BoxAnnotations<T>> = internal.combineAll;

/**
 * Gets the number of rows in a box.
 *
 * Returns the height of the box in terms of text lines.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const multiLine = Box.text("Line 1\nLine 2\nLine 3")
 * console.log(Box.rows(multiLine))
 * // 3
 *
 * const singleLine = Box.text("One line")
 * console.log(Box.rows(singleLine))
 * // 1
 *
 * const empty = Box.nullBox
 * console.log(Box.rows(empty))
 * // 0
 * ```
 *
 * @note Haskell: `rows :: Box -> Int`
 * @category utilities
 */
export const rows: <A>(b: Box<A>) => number = internal.rows;

/**
 * Gets the number of columns in a box.
 *
 * Returns the width of the box in terms of character columns.
 * For multi-line text, returns the width of the longest line.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const text = Box.text("Short\nLonger line\nShort")
 * console.log(Box.cols(text))
 * // 11 (width of "Longer line")
 *
 * const single = Box.text("Hello")
 * console.log(Box.cols(single))
 * // 5
 *
 * const empty = Box.nullBox
 * console.log(Box.cols(empty))
 * // 0
 * ```
 *
 * @note Haskell: `cols :: Box -> Int`
 * @category utilities
 */
export const cols: <A>(b: Box<A>) => number = internal.cols;

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

/**
 * Creates a box with the specified dimensions and content.
 *
 * @category constructors
 */
export const make: <A>(b: {
  rows: number;
  cols: number;
  content: Content<A>;
  annotation?: Annotation<A>;
}) => Box<A> = internal.make;

/**
 * Pattern matching utility for Box content.
 *
 * @category utilities
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
 * Arranges boxes horizontally in a row with the specified vertical alignment.
 *
 * The most fundamental layout combinator for creating horizontal layouts.
 * The alignment parameter controls how boxes of different heights are
 * positioned relative to each other.
 *
 * **Mathematical Properties**
 * - **Associative**: `hcat(a, [hcat(a, [x, y]), z]) ≡ hcat(a, [x, hcat(a, [y, z])])`
 * - **Identity**: `hcat(a, [nullBox, x]) ≡ hcat(a, [x, nullBox]) ≡ x`
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const boxes = [Box.text("Left"), Box.text("Middle"), Box.text("Right")]
 * const horizontal = Box.hcat(boxes, Box.top)
 * console.log(Box.renderSync(horizontal, Box.plain))
 * // LeftMiddleRight
 * ```
 *
 * @note Haskell: `hcat :: Foldable f => Alignment -> f Box -> Box`
 * @category combinators
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
 * Arranges boxes vertically in a column with the specified horizontal alignment.
 *
 * The vertical counterpart to `hcat`, essential for creating column-based layouts.
 * The alignment parameter controls how boxes of different widths are positioned
 * relative to each other.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const boxes = [Box.text("Top"), Box.text("Middle"), Box.text("Bottom")]
 * const vertical = Box.vcat(boxes, Box.left)
 * console.log(Box.renderSync(vertical, Box.plain))
 * // Top
 * // Middle
 * // Bottom
 * ```
 *
 * @note Haskell: `vcat :: Foldable f => Alignment -> f Box -> Box`
 * @category combinators
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
 *
 * A simple binary operation for combining two boxes horizontally with
 * top alignment. Equivalent to `hcat([left, right], top)` but optimized
 * for the two-box case.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const left = Box.text("Left")
 * const right = Box.text("Right")
 * const combined = Box.hAppend(left, right)
 * console.log(Box.renderSync(combined, Box.plain))
 * // LeftRight
 * ```
 *
 * @note Haskell: `instance Semigroup Box where l <> r = hcat top [l,r]`
 * @category combinators
 */
export const hAppend: {
  <A>(l: Box<A>): (self: Box<A>) => Box<A>;
  <A>(self: Box<A>, l: Box<A>): Box<A>;
} = internal.hAppend;

/**
 * Places two boxes side by side with a single space column between them.
 *
 * Convenience function for horizontal concatenation with automatic spacing.
 * Equivalent to `hAppend(left, hAppend(space, right))` where space is a
 * single-character space box.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const left = Box.text("Hello")
 * const right = Box.text("World")
 * const spaced = Box.hcatWithSpace(left, right)
 * console.log(Box.renderSync(spaced, Box.plain))
 * // Hello World
 *
 * // Compare with hAppend (no space)
 * const noSpace = Box.hAppend(left, right)
 * console.log(Box.renderSync(noSpace, Box.plain))
 * // HelloWorld
 * ```
 *
 * @note Haskell: `(<+>) :: Box -> Box -> Box`
 * @category combinators
 */
export const hcatWithSpace: {
  <A>(l: Box<A>): (self: Box<A>) => Box<A>;
  <A>(self: Box<A>, l: Box<A>): Box<A>;
} = internal.hcatWithSpace;

/**
 * Stacks two boxes vertically, one above the other.
 *
 * The vertical counterpart to `hAppend`, combining two boxes in a column
 * with left alignment. Optimized for the two-box case.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const top = Box.text("Top")
 * const bottom = Box.text("Bottom")
 * const stacked = Box.vAppend(top, bottom)
 * console.log(Box.renderSync(stacked, Box.plain))
 * // Top
 * // Bottom
 * ```
 *
 * @note Haskell: `(//) :: Box -> Box -> Box`
 * @category combinators
 */
export const vAppend: {
  <A>(t: Box<A>): (self: Box<A>) => Box<A>;
  <A>(self: Box<A>, t: Box<A>): Box<A>;
} = internal.vAppend;

/**
 * Stacks two boxes vertically with a single empty row between them.
 *
 * Convenience function for vertical concatenation with automatic spacing.
 * Adds visual separation between vertically stacked content.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const top = Box.text("First section")
 * const bottom = Box.text("Second section")
 * const spaced = Box.vcatWithSpace(top, bottom)
 * console.log(Box.renderSync(spaced, Box.plain))
 * // First section
 * //
 * // Second section
 *
 * // Compare with vAppend (no space)
 * const noSpace = Box.vAppend(top, bottom)
 * console.log(Box.renderSync(noSpace, Box.plain))
 * // First section
 * // Second section
 * ```
 *
 * @note Haskell: `(/+/) :: Box -> Box -> Box`
 * @category combinators
 */
export const vcatWithSpace: {
  <A>(t: Box<A>): (self: Box<A>) => Box<A>;
  <A>(self: Box<A>, t: Box<A>): Box<A>;
} = internal.vcatWithSpace;

/**
 * Arranges boxes horizontally with a separator box placed between each pair.
 *
 * Useful for creating lists, navigation bars, or any horizontal sequence
 * where items need consistent separation. The separator is inserted between
 * each adjacent pair of boxes, but not at the beginning or end.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const items = [Box.text("Home"), Box.text("About"), Box.text("Contact")]
 * const separator = Box.text(" | ")
 * const navbar = Box.punctuateH(items, Box.center1, separator)
 * console.log(Box.renderSync(navbar, Box.plain))
 * // Home | About | Contact
 * ```
 *
 *
 * @note Haskell: `punctuateH :: Foldable f => Alignment -> Box -> f Box -> Box`
 * @category combinators
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
 *
 * The vertical counterpart to `punctuateH`, useful for creating vertical
 * lists, menus, or content sections with consistent separation between items.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const menuItems = [
 *   Box.text("File"),
 *   Box.text("Edit"),
 *   Box.text("View"),
 *   Box.text("Help")
 * ]
 * const separator = Box.text("---")
 * const menu = Box.punctuateV(menuItems, Box.left, separator)
 * console.log(Box.renderSync(menu, Box.plain))
 * // File
 * // ---
 * // Edit
 * // ---
 * // View
 * // ---
 * // Help
 * ```
 *
 * @note Haskell: `punctuateV :: Foldable f => Alignment -> Box -> f Box -> Box`
 * @category combinators
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
 *
 * @note Haskell: `hsep :: Foldable f => Int -> Alignment -> f Box -> Box`
 */
export const hsep: {
  (sep: number, a: Alignment): <A>(self: readonly Box<A>[]) => Box<A>;
  <A>(self: readonly Box<A>[], sep: number, a: Alignment): Box<A>;
} = internal.hsep;

/**
 * Arranges boxes vertically with the specified amount of space between each.
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
 *
 * @note Haskell: `alignHoriz :: Alignment -> Int -> Box -> Box`
 */
export const alignHoriz: {
  (a: Alignment, c: number): <A>(self: Box<A>) => Box<A>;
  <A>(self: Box<A>, a: Alignment, c: number): Box<A>;
} = internal.alignHoriz;

/**
 * Vertically aligns a box within a specified height.
 *
 * @note Haskell: `alignVert :: Alignment -> Int -> Box -> Box`
 */
export const alignVert: {
  (a: Alignment, r: number): <A>(self: Box<A>) => Box<A>;
  <A>(self: Box<A>, a: Alignment, r: number): Box<A>;
} = internal.alignVert;

/**
 * Aligns a box within specified dimensions using both horizontal and vertical alignment.
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
 * Aligns a box to the left within its container.
 *
 * Ensures left alignment without changing the box dimensions. Useful
 * as a convenience function when you need explicit left alignment.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const box = Box.text("Hello\nWorld")
 * const leftAligned = Box.alignLeft(box)
 * console.log(Box.renderSync(leftAligned, Box.plain))
 * // Hello
 * // World
 * ```
 *
 * @category transformations
 */
export const alignLeft: <A>(self: Box<A>) => Box<A> = internal.alignLeft;

/**
 * Moves a box up by adding empty rows below it.
 *
 * Increases the total height of the box by adding blank rows at the bottom,
 * effectively moving the content upward within a larger container.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const box = Box.text("Content")
 * const moved = Box.moveUp(box, 2)
 * console.log(`Original: ${Box.rows(box)} rows`)
 * // Original: 1 rows
 * console.log(`Moved: ${Box.rows(moved)} rows`)
 * // Moved: 3 rows
 * console.log(Box.renderSync(moved, Box.plain))
 * // Content
 * //
 * //
 * ```
 *
 * @note Haskell: `moveUp :: Int -> Box -> Box`
 * @category transformations
 */
export const moveUp: {
  (n: number): <A>(self: Box<A>) => Box<A>;
  <A>(self: Box<A>, n: number): Box<A>;
} = internal.moveUp;

/**
 * Moves a box down by adding empty rows above it.
 *
 * Increases the total height of the box by adding blank rows at the top,
 * effectively moving the content downward within a larger container.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const content = Box.text("Main content")
 * const withSpacing = Box.moveDown(content, 2)
 * console.log(Box.renderSync(withSpacing, Box.plain))
 * //
 * //
 * // Main content
 * ```
 *
 * @note Haskell: `moveDown :: Int -> Box -> Box`
 * @category transformations
 */
export const moveDown: {
  (n: number): <A>(self: Box<A>) => Box<A>;
  <A>(self: Box<A>, n: number): Box<A>;
} = internal.moveDown;

/**
 * Moves a box left by adding empty columns to the right.
 *
 * Increases the total width of the box by adding spaces to the right,
 * effectively moving the content leftward within a larger container.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const box = Box.text("Hello")
 * const moved = Box.moveLeft(box, 3)
 * console.log(`Original: ${Box.cols(box)} cols`)
 * // Original: 5 cols
 * console.log(`Moved: ${Box.cols(moved)} cols`)
 * // Moved: 8 cols
 * console.log(`"${Box.renderSync(moved, Box.plain)}"`)
 * // "Hello   "
 * ```
 *
 * @note Haskell: `moveLeft :: Int -> Box -> Box`
 * @category transformations
 */
export const moveLeft: {
  (n: number): <A>(self: Box<A>) => Box<A>;
  <A>(self: Box<A>, n: number): Box<A>;
} = internal.moveLeft;

/**
 * Moves a box right by adding empty columns to the left.
 *
 * Increases the total width of the box by adding spaces to the left,
 * effectively moving the content rightward within a larger container.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const text = Box.text("Indented content")
 * const indented = Box.moveRight(text, 4)
 * console.log(`"${Box.renderSync(indented, Box.plain)}"`)
 * // "    Indented content"
 * ```
 *
 * @note Haskell: `moveRight :: Int -> Box -> Box`
 * @category transformations
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
 *
 * @category utilities
 */
export const defaultRenderConfig: Renderer.RenderStyle =
  internal.defaultRenderConfig;

/**
 * Merges multiple arrays of rendered text lines into a single array.
 *
 * @note Haskell: `merge = foldr (zipWith (++)) (repeat [])`
 * @category utilities
 */
export const merge: (renderedBoxes: string[][]) => string[] = internal.merge;

/**
 * Takes up to n elements from an array, padding with a default value if needed.
 *
 * @note Haskell: `takeP :: a -> Int -> [a] -> [a]`
 * @category utilities
 */
export const takeP: {
  <A>(a: A, n: number): (self: readonly A[]) => A[];
  <A>(self: readonly A[], a: A, n: number): A[];
} = internal.takeP;

/**
 * Takes elements from an array with alignment, padding as needed.
 *
 * @note Haskell: `takePA :: Alignment -> a -> Int -> [a] -> [a]`
 * @category utilities
 */
export const takePA: {
  <A>(alignment: Alignment, a: A, n: number): (self: readonly A[]) => A[];
  <A>(self: readonly A[], alignment: Alignment, a: A, n: number): A[];
} = internal.takePA;

/**
 * Creates a string of spaces with the specified length.
 *
 * @note Haskell: `blanks :: Int -> String`
 * @category utilities
 */
export const blanks: (n: number) => string = internal.blanks;

/**
 * Adjusts the size of rendered text lines to specific dimensions.
 *
 * @note Haskell: `resizeBox :: Int -> Int -> [String] -> [String]`
 * @category utilities
 */
export const resizeBox: {
  (r: number, c: number): (self: string[]) => string[];
  (self: string[], r: number, c: number): string[];
} = internal.resizeBox;

/**
 * Adjusts the size of rendered text lines with alignment options.
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
 * Synchronously converts a box to a string suitable for display.
 *
 * The primary function for converting boxes to string representation.
 * Uses the specified render style to control output formatting.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const box = Box.text("Hello\nWorld")
 * const output = Box.renderSync(box, Box.pretty)
 * console.log(output)
 * // Hello
 * // World
 *
 * const plainOutput = Box.renderSync(box, Box.plain)
 * console.log(plainOutput)
 * // Hello
 * // World
 * ```
 *
 * @note Haskell: `render :: Box -> String`
 * @category utilities
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
 *
 * Unlike `renderSync`, this function maintains exact spacing including trailing
 * spaces on each line, which can be important for precise text alignment.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const box = Box.text("Hello   ")
 * const withSpaces = Box.renderWithSpaces(box)
 * const regular = Box.renderSync(box, Box.plain)
 *
 * console.log(`"${withSpaces}"`)
 * // "Hello   "
 * console.log(`"${regular}"`)
 * // "Hello" (trailing spaces trimmed)
 * ```
 *
 * @note Haskell: `renderWithSpaces :: Box -> String`
 * @category utilities
 */
export const renderWithSpaces: <A>(self: Box<A>) => string =
  internal.renderWithSpaces;

/**
 * Converts a box to a string using a custom separator instead of spaces.
 *
 * @category utilities
 */
export const renderWith: {
  (sep?: string): <A>(self: Box<A>) => string;
  <A>(self: Box<A>, sep?: string): string;
} = internal.renderWith;

/**
 * Prints a box to the console using the Effect Console.
 *
 * @note Haskell: `printBox :: Box -> IO ()`
 * @category utilities
 */
export const printBox: <A>(
  b: Box<A>
) => Effect.Effect<void, never, Renderer.Renderer> = internal.printBox;

/**
 * Pretty rendering style with enhanced formatting.
 *
 * @category constructors
 */
export const pretty: Renderer.RenderStyle = internal.pretty;

/**
 * Plain rendering style without special formatting.
 *
 * @category constructors
 */
export const plain: Renderer.RenderStyle = internal.plain;

/*
 *  --------------------------------------------------------------------------------
 *  --  Annotation Functions  ------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Adds an annotation to a box.
 *
 * Annotations provide a way to attach additional data (like styling information)
 * to boxes without affecting their layout properties. Commonly used with the
 * Ansi module for colored terminal output.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 * import * as Annotation from "effect-boxes/Annotation"
 * import * as Ansi from "effect-boxes/Ansi"
 *
 * const coloredBox = Box.annotate(
 *   Box.text("Hello World"),
 *   Annotation.color(Ansi.red)
 * )
 * ```
 *
 * @category transformations
 */
export const annotate: {
  <A>(annotation: Annotation<A>): <B>(self: Box<B>) => Box<A>;
  <B, A>(self: Box<B>, annotation: Annotation<A>): Box<A>;
} = internal.annotate;

/**
 * Removes the annotation from a box, returning a Box<never>.
 *
 * Strips all annotation data from a box, leaving only the layout structure
 * and content. Useful when you need a plain box without styling.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 * import * as Annotation from "effect-boxes/Annotation"
 * import * as Ansi from "effect-boxes/Ansi"
 *
 * const annotatedBox = Box.annotate(
 *   Box.text("Styled text"),
 *   Annotation.color(Ansi.red)
 * )
 *
 * const plainBox = Box.unAnnotate(annotatedBox)
 * // Now plainBox has no color annotation
 * ```
 *
 * @category transformations
 */
export const unAnnotate: <A>(self: Box<A>) => Box<never> = internal.unAnnotate;

/**
 * Transforms the annotation of a box using a provided function.
 *
 * Applies a transformation function to the box's annotation, allowing you
 * to modify or convert annotation data. If the box has no annotation,
 * returns the box unchanged.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 * import * as Annotation from "effect-boxes/Annotation"
 * import * as Ansi from "effect-boxes/Ansi"
 *
 * const redBox = Box.annotate(
 *   Box.text("Text"),
 *   Annotation.color(Ansi.red)
 * )
 *
 * // Transform red to blue
 * const blueBox = Box.reAnnotate(redBox, (ann) =>
 *   Annotation.color(Ansi.blue)
 * )
 * ```
 *
 * @category transformations
 */
export const reAnnotate: {
  <A, B>(transform: (annotation: A) => B): (self: Box<A>) => Box<B>;
  <A, B>(self: Box<A>, transform: (annotation: A) => B): Box<B>;
} = internal.reAnnotate;

/**
 * Applies a function to modify annotations within a box structure, creating multiple boxes.
 *
 * The alter function receives an annotation and returns an array of new annotations.
 * Returns an array of boxes, one for each annotation returned by the alter function.
 * If the box has no annotation, throws an error.
 *
 * @example
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 * import * as Annotation from "effect-boxes/Annotation"
 * import * as Ansi from "effect-boxes/Ansi"
 *
 * const baseBox = Box.annotate(
 *   Box.text("Message"),
 *   Annotation.color(Ansi.red)
 * )
 *
 * // Create multiple color variations
 * const variations = Box.alterAnnotation(baseBox, (ann) => [
 *   Annotation.color(Ansi.red),
 *   Annotation.color(Ansi.green),
 *   Annotation.color(Ansi.blue)
 * ])
 * // Returns array of 3 boxes with different colors
 * ```
 *
 * @category transformations
 */
export const alterAnnotation: {
  <A, B>(alter: (annotation: A) => B[]): (self: Box<A>) => Box<B>[];
  <A, B>(self: Box<A>, alter: (annotation: A) => B[]): Box<B>[];
} = internal.alterAnnotation;
