/**
 * @internal
 */
import { pipe } from "effect";
import type * as Box from "../Box.js";
import * as internal from "./box.js";

/*
 *  --------------------------------------------------------------------------------
 *  --  Types  ---------------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/** @internal */
export interface ContainerContext {
  readonly width: number;
  readonly height: number;
  readonly innerWidth: number;
  readonly innerHeight: number;
}

/** @internal */
export interface ContainerOptions {
  readonly width: number;
  readonly height?: number;
  readonly padding?: number | readonly [number, number];
}

/*
 *  --------------------------------------------------------------------------------
 *  --  Internals  -----------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

const resolvePadding = (
  options: ContainerOptions
): readonly [number, number] => {
  if (options.padding == null) return [0, 0];
  return typeof options.padding === "number"
    ? [options.padding, options.padding]
    : options.padding;
};

/*
 *  --------------------------------------------------------------------------------
 *  --  Implementation  ------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/** @internal */
export const make = <A>(
  options: ContainerOptions,
  builder: (ctx: ContainerContext) => Box.Box<A>
): Box.Box<A> => {
  const height = options.height ?? 0;
  const [py, px] = resolvePadding(options);
  const innerWidth = Math.max(0, options.width - px * 2);
  const innerHeight = Math.max(0, height - py * 2);

  const ctx: ContainerContext = {
    width: options.width,
    height,
    innerWidth,
    innerHeight,
  };

  return pipe(
    builder(ctx),
    (content) => internal.alignHoriz(content, internal.left, innerWidth),
    (widthEnforced) =>
      py > 0 || px > 0
        ? (internal.pad(py, px)(widthEnforced) as Box.Box<A>)
        : widthEnforced
  );
};
