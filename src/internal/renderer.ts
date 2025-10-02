import { Array, Context, Effect, Option, pipe } from "effect";
import { dual } from "effect/Function";
import type * as Annotation from "../Annotation";
import type * as Box from "../Box";
import type * as R from "../Renderer";
import { blanks, match, merge, takeP, takePA } from "./box";

export class Renderer extends Context.Tag("Renderer")<
  Renderer,
  {
    readonly renderContent: <A>(box: Box.Box<A>) => Effect.Effect<string[]>;
    readonly postProcess: <A>(
      lines: string[],
      annotation?: Annotation.Annotation<A>
    ) => Effect.Effect<string[]>;
    readonly processor: R.TextProcessor;
  }
>() {}

export const defaultRenderConfig: R.RenderConfig = {
  preserveWhitespace: false,
};

export const renderBoxArray = <A>(
  boxes: Box.Box<A>[],
  renderRecursive: <B>(childBox: Box.Box<B>) => Effect.Effect<string[]>,
  combineLines: (rendered: string[][]) => string[]
): Effect.Effect<string[]> =>
  pipe(
    boxes,
    Array.match({
      onEmpty: () => Effect.succeed([]),
      onNonEmpty: (boxes) =>
        pipe(
          boxes,
          Array.head,
          Option.match({
            onNone: () => Effect.succeed([]),
            onSome: (firstBox) =>
              boxes.length === 1
                ? renderRecursive(firstBox)
                : pipe(
                    Effect.all(Array.map(boxes, renderRecursive)),
                    Effect.map(combineLines)
                  ),
          })
        ),
    })
  );

/** @internal */
export const renderBox = <A>(
  box: Box.Box<A>,
  processor: R.TextProcessor,
  renderRecursive: <B>(childBox: Box.Box<B>) => Effect.Effect<string[]>
): Effect.Effect<string[]> =>
  match(box, {
    blank: () =>
      Effect.succeed(
        // Zero-width boxes should render as empty, not as newlines
        box.cols === 0
          ? []
          : resizeBoxWithProcessor([""], box.rows, box.cols, processor)
      ),
    text: (text) =>
      Effect.succeed(
        resizeBoxWithProcessor([text], box.rows, box.cols, processor)
      ),
    row: (boxes) =>
      pipe(
        renderBoxArray(boxes, renderRecursive, merge),
        Effect.map((lines) =>
          resizeBoxWithProcessor(lines, box.rows, box.cols, processor)
        )
      ),
    col: (boxes) =>
      pipe(
        renderBoxArray(boxes, renderRecursive, Array.flatten),
        Effect.map((lines) =>
          resizeBoxWithProcessor(lines, box.rows, box.cols, processor)
        )
      ),
    subBox: (subBox, xAlign, yAlign) =>
      pipe(
        renderRecursive(subBox),
        Effect.map((rendered) =>
          resizeBoxAlignedWithProcessor(
            rendered,
            box.rows,
            box.cols,
            xAlign,
            yAlign,
            processor
          )
        )
      ),
  });

/** @internal */
const resizeBoxWithProcessor = (
  lines: string[],
  rows: number,
  cols: number,
  processor: R.TextProcessor
): string[] =>
  pipe(
    Array.map(lines, (line) => processor.processLine(line, cols)),
    takeP(blanks(cols), rows)
  );

/** @internal */
const resizeBoxAlignedWithProcessor = (
  lines: string[],
  rows: number,
  cols: number,
  hAlign: Box.Alignment,
  vAlign: Box.Alignment,
  processor: R.TextProcessor
): string[] =>
  takePA(
    Array.map(lines, (line) =>
      processor.processLineAligned(line, cols, hAlign)
    ),
    vAlign,
    blanks(cols),
    rows
  );

export const renderBoxToLines = <A>(
  box: Box.Box<A>
): Effect.Effect<string[], never, Renderer> =>
  Effect.gen(function* () {
    const renderer = yield* Renderer;
    return yield* renderer.renderContent(box);
  });

export const renderLinesToString = dual<
  (config?: R.RenderConfig) => (lines: string[]) => string,
  (lines: string[], config?: R.RenderConfig) => string
>(2, (lines, config) => {
  const { preserveWhitespace } = {
    ...defaultRenderConfig,
    ...config,
  };

  if (preserveWhitespace) {
    return lines.join("\n");
  }
  return lines.map((line) => line.trimEnd()).join("\n");
});

// -----------------------------------------------------------------------------
// Renderer Selection Utilities
// -----------------------------------------------------------------------------

/** @internal */
export const render = dual<
  <A>(
    config?: R.RenderConfig
  ) => (box: Box.Box<A>) => Effect.Effect<string, never, Renderer>,
  <A>(
    box: Box.Box<A>,
    config?: R.RenderConfig
  ) => Effect.Effect<string, never, Renderer>
>(2, (box, config) =>
  Effect.gen(function* () {
    const lines = yield* renderBoxToLines(box);
    return renderLinesToString(lines, config);
  })
);
