import { BunFileSystem, BunPath, BunTerminal } from "@effect/platform-bun";
import {
  Console,
  Data,
  Effect,
  HashMap,
  Layer,
  Option,
  pipe,
  type Terminal,
} from "effect";
import { Prompt } from "effect/unstable/cli";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";
import * as Cmd from "../src/Cmd";
import * as Reactive from "../src/Reactive";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type TextPromptState = {
  readonly cursor: number;
  readonly value: string;
};

interface TextOptions {
  readonly message: string;
  readonly default?: string;
}

// Create Action tagged enum for Prompt.custom
const Action = Data.taggedEnum<Prompt.ActionDefinition>();

// ----------------------------------------------------------------------------
// Cursor Helpers
// ----------------------------------------------------------------------------

const relativeCursorMove = <A>(
  layout: Box.Box<A>,
  reactiveId: string,
  cursorOffset = 0
): Option.Option<{ rowsUp: number; col: number }> => {
  const positions = Reactive.getPositions(layout);
  const pos = HashMap.get(positions, reactiveId);
  return Option.map(pos, (p) => ({
    rowsUp: layout.rows - p.row - 1,
    col: p.col + cursorOffset,
  }));
};

// ----------------------------------------------------------------------------
// Rendering
// ----------------------------------------------------------------------------

const Border = <A>(self: Box.Box<A>): Box.Box<A> => {
  const top = Box.hcat(
    [Box.char("╭"), Box.text("─".repeat(self.cols)), Box.char("╮")],
    Box.top
  );
  const bottom = Box.hcat(
    [Box.char("╰"), Box.text("─".repeat(self.cols)), Box.char("╯")],
    Box.top
  );
  const side = Box.vcat(
    Array.from({ length: self.rows }, () => Box.char("│")),
    Box.left
  );
  const middle = Box.hcat([side, self, side], Box.top);
  return Box.vcat([top, middle, bottom], Box.left);
};

const Padding =
  <A>(vertical: number, horizontal?: number) =>
  (self: Box.Box<A>): Box.Box<A> => {
    const h = horizontal ?? vertical;
    return pipe(
      self,
      Box.moveUp(vertical),
      Box.moveDown(vertical),
      Box.moveLeft(h),
      Box.moveRight(h)
    );
  };

const renderLayout = (
  state: TextPromptState,
  message: string,
  submitted: boolean
): Box.Box<Ansi.AnsiStyle | Reactive.Reactive> => {
  const prefix = submitted
    ? Box.text("✔").pipe(Box.annotate(Ansi.green))
    : Box.text("?").pipe(Box.annotate(Ansi.cyan));

  const label = Box.text(message).pipe(Box.annotate(Ansi.bold));

  if (submitted) {
    // After submission, render input on same line as message with checkmark
    return Box.hsep(
      [prefix, label, Box.text(state.value).pipe(Box.annotate(Ansi.cyan))],
      1,
      Box.top
    );
  }

  // Before submission, render input in separate box below message
  const valueDisplay = (
    state.value.length > 0
      ? Box.text(state.value).pipe(Box.annotate(Ansi.white))
      : Box.text(" ").pipe(Box.annotate(Ansi.dim))
  ).pipe(Reactive.makeReactive("input-field"));

  return Box.vcat(
    [
      Box.hsep<Ansi.AnsiStyle | Reactive.Reactive>(
        [prefix, label.pipe(Box.annotate(Ansi.cyan))],
        1,
        Box.top
      ).pipe(Box.moveRight(2)),
      Box.hsep<Ansi.AnsiStyle | Reactive.Reactive>(
        [Box.char(">"), valueDisplay],
        1,
        Box.top
      ).pipe(Box.alignHoriz(Box.left, 60), Padding(0, 1), Border),
    ],

    Box.left
  );
};

// ----------------------------------------------------------------------------
// BoxInput using Prompt.custom
// ----------------------------------------------------------------------------

export const BoxInput = (options: TextOptions): Prompt.Prompt<string> => {
  const { message, default: defaultValue = "" } = options;

  const initialState: TextPromptState = {
    cursor: defaultValue.length,
    value: defaultValue,
  };

  return Prompt.custom<TextPromptState, string>(initialState, {
    render: (
      state: TextPromptState,
      action: Prompt.Action<TextPromptState, string>
    ) =>
      Action.$match(action, {
        Beep: () => Effect.succeed(""),

        NextFrame: ({ state: nextState }) => {
          const layout = renderLayout(nextState, message, false);
          const move = relativeCursorMove(
            layout,
            "input-field",
            nextState.cursor
          );

          return Effect.succeed(
            Box.renderPrettySync(
              Option.isSome(move)
                ? Box.vcat(
                    [
                      layout,
                      Cmd.cursorPrevLine(move.value.rowsUp),
                      Cmd.cursorForward(move.value.col),
                    ],
                    Box.left
                  )
                : layout
            )
          );
        },

        Submit: ({ value }) =>
          Effect.succeed(
            Box.renderPrettySync(
              renderLayout({ ...state, value }, message, true).pipe(
                Box.vAppend<Ansi.AnsiStyle | Reactive.Reactive>(Box.text(""))
              )
            )
          ),
      }),

    process: (input: Terminal.UserInput, state: TextPromptState) => {
      switch (input.key.name) {
        case "backspace": {
          if (state.cursor <= 0) return Effect.succeed(Action.Beep());
          const before = state.value.slice(0, state.cursor - 1);
          const after = state.value.slice(state.cursor);
          return Effect.succeed(
            Action.NextFrame({
              state: { cursor: state.cursor - 1, value: before + after },
            })
          );
        }

        case "left":
          if (state.cursor <= 0) return Effect.succeed(Action.Beep());
          return Effect.succeed(
            Action.NextFrame({ state: { ...state, cursor: state.cursor - 1 } })
          );

        case "right":
          if (state.cursor >= state.value.length)
            return Effect.succeed(Action.Beep());
          return Effect.succeed(
            Action.NextFrame({ state: { ...state, cursor: state.cursor + 1 } })
          );

        case "enter":
        case "return":
          return Effect.succeed(Action.Submit({ value: state.value }));

        default: {
          if (Option.isSome(input.input) && input.input.value.length === 1) {
            const char = input.input.value;
            const before = state.value.slice(0, state.cursor);
            const after = state.value.slice(state.cursor);
            return Effect.succeed(
              Action.NextFrame({
                state: {
                  cursor: state.cursor + 1,
                  value: before + char + after,
                },
              })
            );
          }
          return Effect.succeed(Action.Beep());
        }
      }
    },

    clear: (
      state: TextPromptState,
      _action: Prompt.Action<TextPromptState, string>
    ) => {
      const layout = renderLayout(state, message, false);
      const move = relativeCursorMove(layout, "input-field", state.cursor);

      return Effect.succeed(
        Box.renderPrettySync(
          Option.isSome(move)
            ? Box.combine(
                Cmd.cursorNextLine(move.value.rowsUp),
                Cmd.clearLines(layout.rows)
              )
            : Cmd.clearLines(layout.rows)
        )
      );
    },
  });
};

// ----------------------------------------------------------------------------
// Demo
// ----------------------------------------------------------------------------

const PromptLive = Layer.mergeAll(
  BunTerminal.layer,
  BunFileSystem.layer,
  BunPath.layer
);

const main = Effect.gen(function* () {
  const name = yield* BoxInput({ message: "What is your name?" });
  const food = yield* BoxInput({
    message: "What is your favorite food?",
    default: "Pizza",
  });

  yield* Console.log(
    Box.renderPrettySync(
      Box.combineAll([
        Box.text("Hello "),
        Box.text(name).pipe(Box.annotate(Ansi.green)),
        Box.text("! Your favorite food is "),
        Box.text(food).pipe(Box.annotate(Ansi.green)),
      ]).pipe(Padding(1, 2), Border)
    )
  );
}).pipe(Effect.provide(PromptLive));

Effect.runPromise(main).catch(console.error);
