import { Array, Console, Effect, pipe, Ref, Schedule, Stream } from "effect";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";
import * as Cmd from "../src/Cmd";

const display = (msg: string) => Effect.sync(() => process.stdout.write(msg));

const ProgressBar = (progress: number, total: number, width: number) => {
  const ratio = Math.min(Math.max(progress / total, 0), 1);
  const filledLength = Math.round(ratio * width);
  const emptyLength = width - filledLength;

  const r = Math.round(255 * (1 - ratio));
  const g = Math.round(255 * ratio);
  const progressColor = Ansi.colorRGB(r, g, 0);

  const filledBar = Box.text("█".repeat(filledLength)).pipe(
    Box.annotate(progressColor)
  );
  const emptyBar = Box.text("░".repeat(emptyLength));
  return pipe(filledBar, Box.hAppend<Ansi.AnsiStyle>(emptyBar));
};

const Padding =
  <A>(width: number) =>
  (self: Box.Box<A>) =>
    pipe(
      self,
      Box.moveUp(width),
      Box.moveDown(width),
      Box.moveLeft(width),
      Box.moveRight(width)
    );

const Border = <A>(self: Box.Box<A>) => {
  const middleBorder = pipe(
    Array.makeBy(self.rows, () => Box.char("│")),
    Box.vcat(Box.left)
  );

  const topBorder = pipe(
    [Box.char("┌"), Box.text("─".repeat(self.cols)), Box.char("┐")],
    Box.hcat(Box.top)
  );

  const bottomBorder = pipe(
    [Box.char("└"), Box.text("─".repeat(self.cols)), Box.char("┘")],
    Box.hcat(Box.top)
  );

  const middleSection = pipe(
    [middleBorder, self, middleBorder],
    Box.hcat(Box.top)
  );

  return pipe([topBorder, middleSection, bottomBorder], Box.vcat(Box.left));
};

/**
 * Demonstrates partial rerendering by updating specific parts of the UI
 * without clearing the entire screen.
 *
 * This example shows:
 * 1. Initial layout rendering - displays a complete UI structure once
 * 2. Cursor positioning - moves to specific coordinates for targeted updates
 * 3. Character-by-character updates - adds progress bar characters incrementally
 * 4. Multiple simultaneous updates - updates percentage, counter, and spinner
 * 5. Efficient rendering - only redraws changed parts, not the entire screen
 *
 * Key concepts:
 * - Use CMD.cursorTo() to position cursor at specific coordinates
 * - Render individual Box elements at cursor positions
 * - Combine cursor commands with styled text for precise placement
 * - Avoid full screen clears for better performance and less flicker
 */
const main = Effect.gen(function* () {
  // Clear screen and hide cursor for cleaner output
  yield* display(Ansi.renderAnnotatedBox(Cmd.clearScreen).join(""));
  yield* display(Ansi.renderAnnotatedBox(Cmd.cursorHide).join(""));

  // Define UI dimensions and layout
  const ProgressBarWidth = 40;
  const Complete = ProgressBarWidth;
  const counterRef = yield* Ref.make(0);

  // Create the initial static layout
  const headerBox = Box.vcat(
    [
      Box.text("╭─ Partial Rerendering Demo ──╮").pipe(Box.annotate(Ansi.cyan)),
      Box.text("│ Watch individual characters │").pipe(Box.annotate(Ansi.cyan)),
      Box.text("│ being updated in real-time! │").pipe(Box.annotate(Ansi.cyan)),
      Box.text("╰─────────────────────────────╯").pipe(Box.annotate(Ansi.cyan)),
    ],
    Box.left
  );

  const footerBox = Box.punctuateV(
    [
      Box.text("Counter: 0").pipe(Box.annotate(Ansi.yellow)),
      Box.punctuateH(
        [
          Box.text("Press"),
          Box.text("Ctrl+C").pipe(Box.annotate(Ansi.red)),
          Box.text("to stop..."),
        ],
        Box.left,
        Box.text(" ")
      ),
    ],
    Box.left,
    Box.text(" ")
  );

  // Render the initial layout
  yield* Console.log(Box.renderPrettySync(headerBox));
  yield* Console.log(
    Box.renderPrettySync(
      Box.hcat(
        [
          ProgressBar(0, Complete, ProgressBarWidth).pipe(Border),
          Box.text(`${((0 / Complete) * 100).toFixed(0)}%`).pipe(
            Box.alignHoriz(Box.right, 5),
            Box.annotate(Ansi.blue),
            Border,
            Box.annotate(Ansi.green)
          ),
        ],
        Box.center1
      ).pipe(Padding(1), Border)
    )
  );
  yield* Console.log(Box.renderPrettySync(footerBox));

  // Calculate positions for dynamic updates
  const progressBarRow = 7; // Row where progress bar characters go
  const progressBarStartCol = 3; // Column where '[' ends and bar begins
  const percentageRow = 7; // Row where percentage is displayed
  const percentageCol = 6 + ProgressBarWidth; // Column after '] '
  const counterRow = 11; // Row where counter is displayed
  const counterCol = 9; // Column after 'Counter: '

  // Create the animation stream
  const tickStream = Stream.repeatEffect(
    Effect.gen(function* () {
      const counter = yield* Ref.updateAndGet(counterRef, (n) => n + 1);
      return { counter };
    })
  ).pipe(
    Stream.schedule(Schedule.spaced("100 milli")),
    Stream.takeUntil(({ counter }) => counter > Complete)
  );

  // Process each tick with partial updates - this is the core of partial rerendering
  yield* Stream.runForEach(tickStream, ({ counter }) =>
    Effect.gen(function* () {
      const progress = Math.min(counter, Complete);
      const percentage = Math.round((progress / Complete) * 100);

      if (counter <= Complete) {
        yield* display(
          pipe(
            // PARTIAL UPDATE #1: Progress bar - add one character at a time
            Cmd.cursorTo(progressBarStartCol, progressBarRow),
            Box.combine(ProgressBar(counter, Complete, ProgressBarWidth)),

            // PARTIAL UPDATE #2: Percentage - overwrite just the percentage value
            Box.combine(Cmd.cursorTo(percentageCol, percentageRow)),
            Box.combine(
              Box.text(`${percentage.toString().padStart(3)}%`).pipe(
                Box.annotate(percentage === 100 ? Ansi.green : Ansi.white)
              )
            ),

            // PARTIAL UPDATE #3: Counter - update just the counter number
            Box.combine(Cmd.cursorTo(counterCol, counterRow)),
            Box.combine(
              Box.text(counter.toString().padStart(2)).pipe(
                Box.annotate(Ansi.yellow)
              )
            ),

            // PARTIAL UPDATE #4: Spinner - animate a single character
            Box.combine(Cmd.cursorTo(counterCol + 3, counterRow)),
            Box.combine(
              Box.text(
                ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧"][counter % 8] ?? "⠋"
              ).pipe(Box.annotate(Ansi.blue))
            ),

            // Render all the combined commands and text updates
            Box.renderPrettySync
          )
        );
      } else {
        yield* Effect.sleep("500 milli");
      }
    })
  );

  // Final completion message
  yield* display(
    pipe(
      Cmd.cursorShow,
      Box.combine(
        Box.text("✅ Task completed successfully!\n").pipe(
          Box.annotate(Ansi.green),
          Box.alignVert(Box.bottom, 4)
        )
      ),
      Box.renderPrettySync
    )
  );
});

Effect.runPromise(main);
