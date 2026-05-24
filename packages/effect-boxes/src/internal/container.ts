/**
 * @internal
 */
import { pipe } from "effect";
import type * as Box from "../Box.js";
import type { Container } from "../Layout.js";
import * as internal from "./box.js";

/*
 *  --------------------------------------------------------------------------------
 *  --  Internals  -----------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

const resolvePadding = (
  options: Container.Options
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
  options: Container.Options,
  builder: (ctx: Container.Context) => Box.Box<A>
): Box.Box<A> => {
  const height = options.height ?? 0;
  const [py, px] = resolvePadding(options);
  const innerWidth = Math.max(0, options.width - px * 2);
  const innerHeight = Math.max(0, height - py * 2);

  const ctx: Container.Context = {
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
