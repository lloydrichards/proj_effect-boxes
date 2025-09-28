import type { Effect, Layer } from "effect";
import type * as Box from "./Box";
import * as internal from "./internal/renderer";

export type TextProcessor = {
  readonly processLine: (text: string, targetWidth: number) => string;
  readonly processLineAligned: (
    text: string,
    targetWidth: number,
    alignment: Box.Alignment
  ) => string;
  readonly preservesFormatting: boolean;
};

export type RenderStyle =
  | { readonly _tag: "Plain" }
  | { readonly _tag: "Pretty"; readonly preserveWhitespace?: boolean };

export type RenderConfig = {
  readonly preserveWhitespace?: boolean;
};
/**
 * Renderer service tag for Effect.js dependency injection.
 * Use this to access renderer operations in Effect computations.
 */
export const Renderer = internal.Renderer;
export type Renderer = internal.Renderer;

/**
 * Default render configuration.
 */
export const defaultRenderConfig: RenderConfig = internal.defaultRenderConfig;

// -----------------------------------------------------------------------------
// Core Rendering API (Effect-first)
// -----------------------------------------------------------------------------

export const renderBoxToLines: <A>(
  box: Box.Box<A>
) => Effect.Effect<string[], never, internal.Renderer> =
  internal.renderBoxToLines;

/**
 * Convert rendered lines to a single string with optional configuration.
 *
 * This function takes a string array and converts it to a single string,
 * applying whitespace and newline handling according to the configuration.
 *
 * @example
 * ```typescript
 * // With default configuration
 * pipe(["line1", "line2"], Renderer.renderToString())
 *
 * // With custom configuration
 * pipe(["line1", "line2"], Renderer.renderToString({
 *   preserveWhitespace: true,
 *   partial: true
 * }))
 * ```
 */
export const renderLinesToString: {
  (config?: RenderConfig): (lines: string[]) => string;
  (lines: string[], config?: RenderConfig): string;
} = internal.renderLinesToString;

// -----------------------------------------------------------------------------
// Renderer Selection Utilities
// -----------------------------------------------------------------------------

/**
 * Convenience function to render a box directly to a string.
 *
 * This combines `render` and `renderToString` into a single operation.
 * Useful for simple rendering scenarios where you want the final string output.
 *
 * @example
 * ```typescript
 * const program = pipe(
 *   Box.text("Hello World"),
 *   Renderer.renderBoxToString(),
 *   Effect.provide(PlainRendererLive)
 * )
 * ```
 */
export const render: {
  <A>(
    config?: RenderConfig
  ): (box: Box.Box<A>) => Effect.Effect<string, never, Renderer>;
  <A>(
    box: Box.Box<A>,
    config?: RenderConfig
  ): Effect.Effect<string, never, Renderer>;
} = internal.render;

// -----------------------------------------------------------------------------
// Renderer Layers
// -----------------------------------------------------------------------------

export const PlainRendererLive: Layer.Layer<Renderer> =
  internal.PlainRendererLive;
export const AnsiRendererLive: Layer.Layer<Renderer> =
  internal.AnsiRendererLive;
