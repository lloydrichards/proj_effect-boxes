import { Terminal } from "@effect/platform";
import { BunTerminal } from "@effect/platform-bun";
import { Array, Effect, Match, Option, pipe, Ref, Stream } from "effect";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";
import * as Cmd from "../src/Cmd";
import * as Reactive from "../src/Reactive";

const display = (msg: string) => Effect.sync(() => process.stdout.write(msg));

const Border = <A>(self: Box.Box<A>) => {
  const middleBorder = pipe(
    Array.makeBy(self.rows, () => Box.char("│")),
    Box.vcat(Box.left)
  );

  const topBorder = pipe(
    [Box.char("╭"), Box.text("─".repeat(self.cols)), Box.char("╮")],
    Box.hcat(Box.top)
  );

  const bottomBorder = pipe(
    [Box.char("╰"), Box.text("─".repeat(self.cols)), Box.char("╯")],
    Box.hcat(Box.top)
  );

  const middleSection = pipe(
    [middleBorder, self, middleBorder],
    Box.hcat(Box.top)
  );

  return pipe([topBorder, middleSection, bottomBorder], Box.vcat(Box.left));
};

// State management for the prompt
type PromptState = {
  readonly message: string;
  readonly input: string;
  readonly cursor: number;
  readonly submitted: boolean;
};

// Create the prompt layout using Box
const createPromptLayout = (
  state: PromptState
): Box.Box<Reactive.Reactive | Ansi.AnsiStyle> =>
  Box.punctuateH(
    [
      Box.text("?").pipe(Box.annotate(Ansi.green)),
      Box.text(state.message).pipe(
        Box.annotate(Ansi.combine(Ansi.bold, Ansi.yellow))
      ),
      Box.text(""),
      Box.text(state.input).pipe(Reactive.makeReactive("input-field")),
    ],
    Box.top,
    Box.char(" ")
  ).pipe(
    Box.alignHoriz(Box.left, 80),
    Box.vAppend<Ansi.AnsiStyle | Reactive.Reactive>(
      Box.text(`${state.input.length}/100`).pipe(
        Reactive.makeReactive("length-indicator"),
        Box.alignHoriz(Box.right, 80),
        Box.annotate(Ansi.dim)
      )
    ),
    Box.moveDown(1),
    Box.moveLeft(1),
    Box.moveRight(1),
    Border
  );

// Helper functions for input processing
const handleBackspace = (state: PromptState): PromptState => {
  if (state.cursor > 0) {
    const newInput =
      state.input.slice(0, state.cursor - 1) + state.input.slice(state.cursor);
    return {
      ...state,
      input: newInput,
      cursor: state.cursor - 1,
    };
  }
  return state;
};

const handleRightArrow = (state: PromptState): PromptState => ({
  ...state,
  cursor: Math.min(state.cursor + 1, state.input.length),
});

const handleLeftArrow = (state: PromptState): PromptState => ({
  ...state,
  cursor: Math.max(state.cursor - 1, 0),
});

const handleRegularInput = (char: string, state: PromptState): PromptState => ({
  ...state,
  input:
    state.input.slice(0, state.cursor) + char + state.input.slice(state.cursor),
  cursor: state.cursor + 1,
});

// Handle keyboard input using pattern matching
const processInput = (
  state: PromptState,
  userInput: Terminal.UserInput
): PromptState =>
  pipe(
    Match.value(userInput),
    Match.when(
      ({ key }) => key.name === "return" || key.name === "enter",
      () => ({ ...state, submitted: true })
    ),
    Match.when(
      ({ key }) => key.name === "backspace",
      () => handleBackspace(state)
    ),
    Match.when(
      ({ key }) => key.name === "right",
      () => handleRightArrow(state)
    ),
    Match.when(
      ({ key }) => key.name === "left",
      () => handleLeftArrow(state)
    ),
    Match.when(
      ({ input }) => Option.isSome(input),
      ({ input }) =>
        handleRegularInput(
          Option.getOrElse(input, () => ""),
          state
        )
    ),
    Match.orElse(() => state)
  );

// Render the prompt to terminal
const renderPrompt = (state: PromptState) =>
  Effect.gen(function* () {
    if (state.submitted) {
      return yield* Effect.void;
    }
    const positions = Reactive.getPositions(createPromptLayout(state));
    const inputCursor = Reactive.cursorToReactive(positions, "input-field");
    const lengthCursor = Reactive.cursorToReactive(
      positions,
      "length-indicator"
    );

    if (Option.isSome(inputCursor) && Option.isSome(lengthCursor)) {
      yield* display(
        Box.renderPrettySync(
          Box.combineAll([
            lengthCursor.value,
            Box.text(`${state.input.length}/100`).pipe(Box.annotate(Ansi.dim)),
            // Clear and update input field
            inputCursor.value,
            Box.text(" ".repeat(20)),
            inputCursor.value,
            Box.text(state.input),
            // move cursor to correct position
            inputCursor.value,
            Cmd.cursorForward(state.cursor),
          ])
        )
      );
    }
  });

// Interactive text prompt using Stream-based input handling
const textPrompt = (message: string) =>
  Effect.gen(function* () {
    const terminal = yield* Terminal.Terminal;

    return yield* Effect.scoped(
      Effect.gen(function* () {
        const keyPress = yield* terminal.readInput;
        const stateRef = yield* Ref.make({
          message,
          input: "",
          cursor: 0,
          submitted: false,
        });

        const initialState = yield* Ref.get(stateRef);

        yield* display(
          Box.renderPrettySync(
            Box.combine(Cmd.clearScreen, createPromptLayout(initialState))
          )
        );

        const result = yield* Effect.ensuring(
          pipe(
            Stream.repeatEffect(keyPress.take),
            Stream.scan(initialState, processInput),
            Stream.takeWhile((state) => !state.submitted),
            Stream.runFoldEffect(initialState, (_, cur) =>
              Effect.gen(function* () {
                yield* Ref.set(stateRef, cur);
                yield* renderPrompt(cur);
                return cur;
              })
            )
          ),
          // Cleanup: Clear screen and reset cursor
          display(Box.renderPrettySync(Cmd.clearScreen))
        );

        return result.input;
      })
    );
  });

// Swedish Chef prompt example
const swedishChefPrompt = Effect.gen(function* () {
  const ingredient = yield* textPrompt("What ingredient do you have?");

  const cookingMethod = yield* textPrompt("How should we cook it?");

  yield* display(
    Box.renderPrettySync(
      Box.text(
        `Bork, bork, bork! Ve vill ${cookingMethod} zee ${ingredient} in zee pot, yah!`
      ).pipe(
        Box.annotate(Ansi.green),
        Box.alignHoriz(Box.left, 78),
        Box.moveLeft(2),
        Box.moveRight(2),
        Border
      )
    )
  );
}).pipe(
  Effect.provide(BunTerminal.layer),
  Effect.catchAll(() => display("Goodbye!"))
);

// Run the Swedish Chef example
// Try pressing Ctrl+C to see the cursor cleanup in action
Effect.runPromise(swedishChefPrompt);
