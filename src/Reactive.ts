import { Array, HashMap, Match, Option, pipe } from "effect";
import { dual } from "effect/Function";
import type { Annotation } from "./Annotation";
import { createAnnotation } from "./Annotation";
import type { AnsiStyle } from "./Ansi";
import {
  type Alignment,
  annotate,
  type Box,
  type Content,
  merge,
  resizeBox,
  resizeBoxAligned,
} from "./Box";
import { cursorTo } from "./Cmd";

/*
 *  --------------------------------------------------------------------------------
 *  --  Reactive Types  ------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Reactive identifier type for tracking box positions.
 */
export type Reactive = {
  readonly _tag: "ReactiveId";
  readonly id: string;
};
export type ReactiveAnnotation = Annotation<Reactive>;

/**
 * Map of reactive IDs to their positions in the rendered output.
 */
export type PositionMap = HashMap.HashMap<
  string, // Reactive ID
  {
    readonly row: number; // 0-based row position
    readonly col: number; // 0-based column position
    readonly rows: number; // height of the box
    readonly cols: number; // width of the box
  }
>;

/*
 *  --------------------------------------------------------------------------------
 *  --  Type Guards and Constructors  ----------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Type guard to check if a value is a Reactive annotation.
 * @param value - The value to check
 */
export const isReactive = (value: unknown): value is Reactive =>
  typeof value === "object" &&
  value !== null &&
  "_tag" in value &&
  "id" in value &&
  (value as Record<PropertyKey, unknown>)._tag === "ReactiveId" &&
  typeof (value as Record<PropertyKey, unknown>).id === "string";

/**
 * Creates a ReactiveId with the specified string identifier.
 * @param id - The string identifier for the reactive element
 */
export const make = (id: string): Reactive => ({
  _tag: "ReactiveId" as const,
  id,
});

/**
 * Creates a reactive annotation with the specified string identifier.
 * @param id - The string identifier for the reactive element
 */
export const reactive = (id: string): Annotation<Reactive> =>
  createAnnotation(make(id));

/*
 *  --------------------------------------------------------------------------------
 *  --  Box Annotation Functions  --------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Annotates a box with a reactive identifier for position tracking.
 * Supports dual signatures:
 * - reactiveBox(box, id): Box<ReactiveId>
 * - reactiveBox(id)(box): Box<ReactiveId>
 *
 * @param self - The box to make reactive
 * @param id - The string identifier for tracking this box's position
 */
export const makeReactive = dual<
  (id: string) => <A>(self: Box<A>) => Box<Reactive>,
  <A>(self: Box<A>, id: string) => Box<Reactive>
>(
  2,
  <A>(self: Box<A>, id: string): Box<Reactive> => annotate(self, reactive(id))
);

/*
 *  --------------------------------------------------------------------------------
 *  --  Position Tracking Render Functions  ----------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Collects positions of reactive annotations from a box.
 * @param self - The box to analyze for position tracking
 * @returns The position map containing reactive element positions
 */
export const getPositions = <A>(self: Box<A>): PositionMap => {
  const renderBoxWithTracking = <B>(
    box: Box<B>,
    offsetRow: number,
    offsetCol: number
  ): readonly [string[], PositionMap] => {
    const { cols, content, rows, annotation } = box;

    if (rows === 0 || cols === 0) {
      return [[], HashMap.empty()];
    }

    const basePositions: PositionMap =
      annotation && isReactive(annotation.data)
        ? HashMap.make([
            annotation.data.id,
            {
              row: offsetRow,
              col: offsetCol,
              rows: box.rows,
              cols: box.cols,
            },
          ])
        : HashMap.empty();

    return pipe(
      content,
      Match.type<Content<B>>().pipe(
        Match.tag(
          "Blank",
          () => [resizeBox([""], rows, cols), basePositions] as const
        ),
        Match.tag(
          "Text",
          ({ text }) => [resizeBox([text], rows, cols), basePositions] as const
        ),
        Match.tag("Row", ({ boxes }) => {
          const { rendered, acc } = pipe(
            boxes,
            Array.reduce(
              {
                rendered: [] as string[][],
                acc: basePositions,
                cur: offsetCol,
              },
              (acc, b) => {
                const result = renderBoxWithTracking(b, offsetRow, acc.cur);
                return {
                  rendered: [...acc.rendered, result[0]],
                  acc: HashMap.union(acc.acc, result[1]),
                  cur: acc.cur + b.cols,
                };
              }
            )
          );

          return [pipe(rendered, merge, resizeBox(rows, cols)), acc] as const;
        }),
        Match.tag("Col", ({ boxes }) => {
          // Use reduce to accumulate rendered boxes and positions
          const { lines, acc } = pipe(
            boxes,
            Array.reduce(
              {
                lines: [] as string[],
                acc: basePositions,
                currentRow: offsetRow,
              },
              (acc, b) => {
                const result = renderBoxWithTracking(
                  b,
                  acc.currentRow,
                  offsetCol
                );
                return {
                  lines: [...acc.lines, ...result[0]],
                  acc: HashMap.union(acc.acc, result[1]),
                  currentRow: acc.currentRow + b.rows,
                };
              }
            )
          );

          return [resizeBox(lines, rows, cols), acc] as const;
        }),
        Match.tag("SubBox", ({ box: subBox, xAlign, yAlign }) => {
          const result = renderBoxWithTracking(
            subBox,
            offsetRow + calculateAlignmentOffset(yAlign, rows - subBox.rows),
            offsetCol + calculateAlignmentOffset(xAlign, cols - subBox.cols)
          );

          return [
            pipe(result[0], resizeBoxAligned(rows, cols, xAlign, yAlign)),
            HashMap.union(basePositions, result[1]),
          ] as const;
        }),
        Match.exhaustive
      )
    );
  };

  const calculateAlignmentOffset = (
    alignment: Alignment,
    space: number
  ): number =>
    Match.value(alignment).pipe(
      Match.when("AlignFirst", () => 0),
      Match.when("AlignLast", () => space),
      Match.when("AlignCenter1", () => Math.floor(space / 2)),
      Match.when("AlignCenter2", () => Math.ceil(space / 2)),
      Match.exhaustive
    );

  return renderBoxWithTracking(self, 0, 0)[1];
};

/*
 *  --------------------------------------------------------------------------------
 *  --  Cursor Navigation Commands  ------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Creates a cursor movement command to navigate to a reactive box position.
 * @param positionMap - Map of reactive IDs to their positions
 * @param key - The reactive ID to move the cursor to
 * @returns Option containing cursor movement command, or None if ID not found
 */
export const cursorToReactive = dual<
  (key: string) => (positionMap: PositionMap) => Option.Option<Box<AnsiStyle>>,
  (positionMap: PositionMap, key: string) => Option.Option<Box<AnsiStyle>>
>(2, (positionMap, key) =>
  Option.map(HashMap.get(positionMap, key), (p) => cursorTo(p.col, p.row))
);
