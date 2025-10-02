import { Effect, Layer } from "effect";
import type * as Annotation from "../Annotation";
import type * as Box from "../Box";
import type * as R from "../Renderer";
import {
  truncatePreservingAnsi,
  padPreservingAnsi,
  isAnsi,
  getAnsiEscapeSequence,
  applyAnsiStyling,
  isCommandAnnotation,
} from "../internal/ansi";
import { Renderer, renderBox } from "../internal/renderer";

/** @internal */

export const makeAnsiRenderer = Layer.effect(
  Renderer,
  Effect.gen(function* () {
    const processor: R.TextProcessor = {
      processLine: (text: string, targetWidth: number) =>
        truncatePreservingAnsi(text, targetWidth),
      processLineAligned: (
        text: string,
        targetWidth: number,
        alignment: Box.Alignment
      ) => padPreservingAnsi(text, targetWidth, alignment),
      preservesFormatting: true,
    };

    const postProcess = <A>(
      lines: string[],
      annotation?: Annotation.Annotation<A>
    ) => {
      if (annotation && isAnsi(annotation.data)) {
        const escapeSequence = getAnsiEscapeSequence(annotation.data);
        if (escapeSequence) {
          return Effect.succeed(applyAnsiStyling(lines, escapeSequence));
        }
      }
      return Effect.succeed(lines);
    };

    const renderContent = <A>(box: Box.Box<A>): Effect.Effect<string[]> => {
      if (
        (box.rows === 0 || box.cols === 0) &&
        box.annotation &&
        isCommandAnnotation(box.annotation.data)
      ) {
        const seq = getAnsiEscapeSequence(box.annotation.data);
        return Effect.succeed(seq ? [seq] : []);
      }

      return Effect.gen(function* () {
        const lines = yield* renderBox(box, processor, renderContent);
        return yield* postProcess(lines, box.annotation);
      });
    };

    return {
      processor,
      renderContent,
      postProcess,
    };
  })
);

