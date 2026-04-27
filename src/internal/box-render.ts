import { Console, Effect, pipe } from "effect";
import type * as Box from "../Box";
import * as Renderer from "../Renderer";

/** @internal */
export const defaultRenderConfig: Renderer.RenderStyle = {
  _tag: "Plain",
};

/** @internal */
export const render = Renderer.render;

/** @internal */
export const renderPrettySync = <A>(self: Box.Box<A>): string =>
  pipe(
    Renderer.render(self, { preserveWhitespace: false }),
    Effect.provide(Renderer.AnsiRendererLive),
    Effect.runSync
  );

/** @internal */
export const renderPlainSync = <A>(self: Box.Box<A>): string =>
  pipe(
    Renderer.render(self, { preserveWhitespace: true }),
    Effect.provide(Renderer.PlainRendererLive),
    Effect.runSync
  );

/** @internal */
export const printBox = (
  box: Box.Box<unknown>
): Effect.Effect<void, never, Renderer.Renderer> =>
  Effect.gen(function* () {
    const rendered = yield* render(box);
    yield* Console.log(rendered);
  });
