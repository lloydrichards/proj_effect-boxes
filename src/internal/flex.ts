/**
 * @internal
 */
import { Array as Arr, Match, pipe } from "effect";
import { dual } from "effect/Function";
import type * as Box from "../Box.js";
import * as internal from "./box.js";

/*
 *  --------------------------------------------------------------------------------
 *  --  Types  ---------------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/** @internal */
export interface FlexFixed<A = never> {
  readonly _tag: "Fixed";
  readonly box: Box.Box<A>;
}

/** @internal */
export interface FlexGrow<A = never> {
  readonly _tag: "Grow";
  readonly box: Box.Box<A>;
  readonly factor: number;
}

/** @internal */
export interface FlexFill<A = never> {
  readonly _tag: "Fill";
  readonly builder: (size: number) => Box.Box<A>;
  readonly factor: number;
}

/** @internal */
export type FlexChild<A = never> = FlexFixed<A> | FlexGrow<A> | FlexFill<A>;

/** @internal */
export interface FlexOptions {
  readonly align?: Box.Alignment;
  readonly gap?: number;
}

/*
 *  --------------------------------------------------------------------------------
 *  --  Constructors  --------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/** @internal */
export const fixed = <A>(box: Box.Box<A>): FlexChild<A> => ({
  _tag: "Fixed",
  box,
});

/** @internal */
export const grow = <A>(box: Box.Box<A>, factor = 1): FlexChild<A> => ({
  _tag: "Grow",
  box,
  factor,
});

/** @internal */
export const fill = <A>(
  builder: (size: number) => Box.Box<A>,
  factor = 1
): FlexChild<A> => ({
  _tag: "Fill",
  builder,
  factor,
});

/** @internal */
export const spacer = (factor = 1): FlexChild<never> => ({
  _tag: "Fill",
  builder: (size: number) => internal.emptyBox(0, size),
  factor,
});

/*
 *  --------------------------------------------------------------------------------
 *  --  Internals  -----------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

const flexFactor = <A>(child: FlexChild<A>): number =>
  Match.value(child).pipe(
    Match.tag("Fixed", () => 0),
    Match.orElse((c) => c.factor)
  );

const flexFixedSize = <A>(
  child: FlexChild<A>,
  measure: (box: Box.Box<A>) => number
): number =>
  Match.value(child).pipe(
    Match.tag("Fixed", (c) => measure(c.box)),
    Match.orElse(() => 0)
  );

const computeSizes = <A>(
  children: ReadonlyArray<FlexChild<A>>,
  available: number,
  totalFactor: number
): ReadonlyArray<number> => {
  const baseSizes = Arr.map(children, (child) =>
    Match.value(child).pipe(
      Match.tag("Fixed", () => 0),
      Match.orElse((c) =>
        totalFactor > 0
          ? Math.max(1, Math.floor((c.factor / totalFactor) * available))
          : 1
      )
    )
  );

  const growIndices = pipe(
    children,
    Arr.reduce<number[], FlexChild<A>>([], (acc, child, i) =>
      child._tag !== "Fixed" ? Arr.append(acc, i) : acc
    )
  );

  const bonusIndices = new Set(
    Arr.take(
      growIndices,
      Math.max(0, available - Arr.reduce(baseSizes, 0, (a, b) => a + b))
    )
  );

  return Arr.map(baseSizes, (size, i) =>
    bonusIndices.has(i) ? size + 1 : size
  );
};

const resolveFlexChildren = <A>(
  children: ReadonlyArray<FlexChild<A>>,
  available: number,
  totalFactor: number,
  alignFn: (box: Box.Box<A>, size: number) => Box.Box<A>
): Box.Box<A>[] => {
  const sizes = computeSizes(children, available, totalFactor);

  return Arr.map(children, (child, i) => {
    const size = sizes[i] ?? 0;
    return Match.value(child).pipe(
      Match.tag("Fixed", (c) => c.box),
      Match.tag("Fill", (c) => c.builder(size)),
      Match.tag("Grow", (c) => alignFn(c.box, size)),
      Match.exhaustive
    );
  });
};

/*
 *  --------------------------------------------------------------------------------
 *  --  Row  -----------------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/** @internal */
export const row = dual<
  (
    containerWidth: number,
    options?: FlexOptions
  ) => <A>(self: ReadonlyArray<FlexChild<A>>) => Box.Box<A>,
  <A>(
    self: ReadonlyArray<FlexChild<A>>,
    containerWidth: number,
    options?: FlexOptions
  ) => Box.Box<A>
>(
  (args) => Arr.isArray(args[0]),
  <A>(
    self: ReadonlyArray<FlexChild<A>>,
    containerWidth: number,
    options?: FlexOptions
  ): Box.Box<A> => {
    const align = options?.align ?? internal.top;
    const gap = options?.gap ?? 0;

    const fixedWidth = Arr.reduce(
      self,
      0,
      (sum, c) => sum + flexFixedSize(c, internal.cols)
    );
    const available = Math.max(
      0,
      containerWidth - fixedWidth - gap * Math.max(0, self.length - 1)
    );
    const totalFactor = Arr.reduce(self, 0, (sum, c) => sum + flexFactor(c));

    const sized = resolveFlexChildren(self, available, totalFactor, (box, w) =>
      internal.alignHoriz(box, internal.left, w)
    );

    return internal.hsep(sized, gap, align);
  }
);

/*
 *  --------------------------------------------------------------------------------
 *  --  Col  -----------------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/** @internal */
export const col = dual<
  (
    containerHeight: number,
    options?: FlexOptions
  ) => <A>(self: ReadonlyArray<FlexChild<A>>) => Box.Box<A>,
  <A>(
    self: ReadonlyArray<FlexChild<A>>,
    containerHeight: number,
    options?: FlexOptions
  ) => Box.Box<A>
>(
  (args) => Arr.isArray(args[0]),
  <A>(
    self: ReadonlyArray<FlexChild<A>>,
    containerHeight: number,
    options?: FlexOptions
  ): Box.Box<A> => {
    const align = options?.align ?? internal.left;
    const gap = options?.gap ?? 0;

    const fixedHeight = Arr.reduce(
      self,
      0,
      (sum, c) => sum + flexFixedSize(c, internal.rows)
    );
    const available = Math.max(
      0,
      containerHeight - fixedHeight - gap * Math.max(0, self.length - 1)
    );
    const totalFactor = Arr.reduce(self, 0, (sum, c) => sum + flexFactor(c));

    const sized = resolveFlexChildren(self, available, totalFactor, (box, h) =>
      internal.alignVert(box, internal.top, h)
    );

    return internal.vsep(sized, gap, align);
  }
);
