/**
 * @internal
 */
import { Array as Arr, pipe } from "effect";
import { dual } from "effect/Function";
import type * as Box from "../Box.js";
import type { Grid } from "../Layout.js";
import * as internal from "./box.js";

/*
 *  --------------------------------------------------------------------------------
 *  --  Implementation  ------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/** @internal */
export const make = dual<
  (options: Grid.Options) => <A>(self: ReadonlyArray<Box.Box<A>>) => Box.Box<A>,
  <A>(self: ReadonlyArray<Box.Box<A>>, options: Grid.Options) => Box.Box<A>
>(
  2,
  <A>(self: ReadonlyArray<Box.Box<A>>, options: Grid.Options): Box.Box<A> => {
    const { cols, colWidth } = options;
    const [hGap, vGap] = options.gap ?? [1, 0];
    const align = options.align ?? internal.left;
    const stretch = options.stretch ?? false;

    const sizeCell = (item: Box.Box<A>): Box.Box<A> =>
      stretch
        ? internal.alignHoriz(
            internal.minWidth(item, colWidth),
            align,
            colWidth
          )
        : internal.alignHoriz(item, align, colWidth);

    const padRow = (
      row: ReadonlyArray<Box.Box<A>>
    ): ReadonlyArray<Box.Box<A>> =>
      row.length < cols
        ? Arr.appendAll(
            row,
            Arr.makeBy(cols - row.length, () => internal.emptyBox(1, colWidth))
          )
        : row;

    return pipe(
      Arr.chunksOf(self, cols),
      Arr.map((chunk) =>
        pipe(chunk, Arr.map(sizeCell), padRow, (cells) =>
          internal.hsep(cells, hGap, internal.top)
        )
      ),
      (rows) => internal.vsep(rows, vGap, internal.left)
    );
  }
);

/** @internal */
export const auto = dual<
  (
    containerWidth: number,
    options: Grid.AutoOptions
  ) => <A>(self: ReadonlyArray<Box.Box<A>>) => Box.Box<A>,
  <A>(
    self: ReadonlyArray<Box.Box<A>>,
    containerWidth: number,
    options: Grid.AutoOptions
  ) => Box.Box<A>
>(
  3,
  <A>(
    self: ReadonlyArray<Box.Box<A>>,
    containerWidth: number,
    options: Grid.AutoOptions
  ): Box.Box<A> => {
    const gap = options.gap ?? 1;
    const cols = Math.min(
      self.length,
      Math.max(
        1,
        Math.floor((containerWidth + gap) / (options.minColWidth + gap))
      )
    );
    const rawColWidth = Math.floor((containerWidth - (cols - 1) * gap) / cols);
    const colWidth =
      options.maxColWidth != null
        ? Math.min(rawColWidth, options.maxColWidth)
        : rawColWidth;

    return make(self, {
      cols,
      colWidth,
      gap: [gap, 0],
      align: options.align,
      stretch: options.stretch,
    });
  }
);
