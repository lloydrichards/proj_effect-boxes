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
  Box.punctuateH<Ansi.AnsiStyle | Reactive.Reactive>(
    [
      Box.text("?").pipe(Box.annotate(Ansi.green)),
      Box.text(state.message).pipe(
        Box.annotate(Ansi.combine(Ansi.bold, Ansi.yellow))
      ),
      Box.text(""),
      Reactive.makeReactive(Box.text(state.input), "input-field"),
    ],
    Box.top,
    Box.char(" ")
  ).pipe(
    Box.alignHoriz(Box.left, 80),
    Box.vAppend<Ansi.AnsiStyle | Reactive.Reactive>(
      Box.text(`${state.input.length}/100`).pipe(
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
const processInput = (state: PromptState, input: string): PromptState =>
  pipe(
    Match.value(input),
    Match.when("\r", () => ({ ...state, submitted: true })),
    Match.when("\n", () => ({ ...state, submitted: true })),
    Match.when("\x7f", () => handleBackspace(state)),
    Match.when("\b", () => handleBackspace(state)),
    Match.when("\x1b[C", () => handleRightArrow(state)),
    Match.when("\x1b[D", () => handleLeftArrow(state)),
    Match.when(
      (input) => input.length === 1 && input >= " ",
      (char) => handleRegularInput(char, state)
    ),
    Match.orElse(() => state)
  );

// Render the prompt to terminal
const renderPrompt = (state: PromptState) =>
  Effect.gen(function* () {
    if (state.submitted) {
      return;
    }
    const maybeCursor = Reactive.getPositions(createPromptLayout(state)).pipe(
      Reactive.cursorToReactive("input-field")
    );

    if (Option.isSome(maybeCursor)) {
      yield* pipe(
        Box.combineAll([maybeCursor.value, Box.text(state.input)]),
        Box.render({ partial: true, style: "pretty" }),
        display
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
          Box.render({ partial: true })(
            Cmd.clearScreen.pipe(Box.combine(createPromptLayout(initialState)))
          )
        );

        const result = yield* Effect.ensuring(
          pipe(
            Stream.repeatEffect(keyPress.take),
            Stream.map((input) => Option.getOrElse(input.input, () => "")),
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
          display(Box.render({ partial: true })(Cmd.clearScreen))
        );

        return result.input;
      })
    );
  });

// Example usage with interruption handling
const promptExample = Effect.gen(function* () {
  const name = yield* textPrompt("What is your name?");

  const job = yield* textPrompt("What do you do?");

  yield* display(
    Box.text(`Hello, ${name} the ${job}.`).pipe(
      Box.annotate(Ansi.green),
      Box.alignHoriz(Box.left, 78),
      Box.moveLeft(2),
      Box.moveRight(2),
      Border,
      Box.render({ style: "pretty" })
    )
  );
}).pipe(Effect.provide(BunTerminal.layer));

// Run the example
// Try pressing Ctrl+C to see the cursor cleanup in action
Effect.runPromise(promptExample);
