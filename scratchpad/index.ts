import {
  Array,
  Clock,
  Console,
  Effect,
  pipe,
  Ref,
  Schedule,
  Stream,
} from "effect";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";
import * as Cmd from "../src/Cmd";

const display = (msg: string) => Effect.sync(() => process.stdout.write(msg));

/**
 * Helper to extract command string from CMD box
 */
const getCmdString = (cmdBox: Box.Box<Cmd.CmdType>): string => {
  return cmdBox.annotation?.data.command ?? "";
};

const StatusBar = (status: string, counter: number, time: string) =>
  pipe(
    [
      Box.text(`Status: ${status}`),
      Box.text(`Counter: ${counter}`),
      Box.text(`Time: ${time}`),
    ],
    Box.punctuateH(Box.left, Box.text("  |  "))
  );

const ProgressBar = (progress: number, total: number, width: number) => {
  const ratio = Math.min(Math.max(progress / total, 0), 1);
  const filledLength = Math.round(ratio * width);
  const emptyLength = width - filledLength;

  const r = Math.round(255 * (1 - ratio));
  const g = Math.round(255 * ratio);
  const progressColor =
    progress === total ? Ansi.green : Ansi.colorRGB(r, g, 0);

  const filledBar = Box.text("█".repeat(filledLength)).pipe(
    Box.annotate(progressColor)
  );
  const emptyBar = Box.text("░".repeat(emptyLength));
  return pipe(filledBar, Box.hAppend<Ansi.AnsiStyleType>(emptyBar));
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

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

const main = Effect.gen(function* () {
  // Clear screen and hide cursor for cleaner output
  yield* display(getCmdString(Cmd.clearScreen()));
  yield* display(getCmdString(Cmd.cursorHide()));

  const COMPLETE = 200;
  const PROGRESS_BAR_WIDTH = 69;

  const counterRef = yield* Ref.make(0);

  const top = Box.hcat(
    [
      ProgressBar(0, COMPLETE, PROGRESS_BAR_WIDTH).pipe(Border),
      Box.text(`${((0 / COMPLETE) * 100).toFixed(0)}%`).pipe(
        Box.alignHoriz(Box.right, 5),
        Box.annotate(Ansi.blue),
        Border,
        Box.annotate(Ansi.green)
      ),
    ],
    Box.center1
  ).pipe(Padding(1), Border);

  const bottom = StatusBar("init", 0, "0").pipe(
    Box.alignHoriz(Box.center1, 80),
    Border
  );

  const footer = Box.punctuateH(
    [
      Box.text("Press"),
      Box.text("Ctrl+C").pipe(Box.annotate(Ansi.blue)),
      Box.text("to stop..."),
    ],
    Box.left,
    Box.text(" ")
  );

  const tickStream = Stream.repeatEffect(
    Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis;

      const counter = yield* Ref.updateAndGet(counterRef, (n) => n + 1);

      return { counter, timestamp: now };
    })
  ).pipe(
    Stream.schedule(Schedule.spaced("50 milli")),
    Stream.takeUntil(({ counter }) => counter >= COMPLETE)
  );

  // Render the initial layout
  yield* display(
    Box.render(Box.punctuateV([top, bottom, footer], Box.top, Box.char(" ")), {
      style: "pretty",
    })
  );

  // Calculate positions for dynamic updates
  const progressBarRow = 3; // Row where progress bar characters go (inside first border)
  const progressBarStartCol = 3; // Column where progress bar starts (after left border + padding)
  const percentageCol = 6 + PROGRESS_BAR_WIDTH; // Column after progress bar and borders
  const statusBarRow = 9; // Row where status bar is displayed (inside bottom border)
  const statusBarStartCol = 2; // Column where status starts (after left border)

  // Process each tick with partial updates
  yield* Stream.runForEach(tickStream, ({ counter, timestamp }) =>
    Effect.gen(function* () {
      const progress = Math.min(counter, COMPLETE);
      const percentage = Math.round((progress / COMPLETE) * 100);
      const timeStr = formatTime(timestamp);
      const status = counter >= COMPLETE ? "completed" : "running";

      // PARTIAL UPDATE #1: Progress bar - update the entire progress bar
      yield* display(
        getCmdString(Cmd.cursorTo(progressBarStartCol, progressBarRow))
      );
      yield* display(
        Box.render(ProgressBar(counter, COMPLETE, PROGRESS_BAR_WIDTH), {
          style: "pretty",
          partial: true,
        })
      );

      // PARTIAL UPDATE #2: Percentage - overwrite just the percentage value
      yield* display(getCmdString(Cmd.cursorTo(percentageCol, progressBarRow)));
      const percentageText = `${percentage.toString().padStart(3)}%`;
      const styledPercentage = Box.text(percentageText).pipe(
        Box.annotate(percentage === 100 ? Ansi.green : Ansi.blue)
      );
      yield* display(Box.render(styledPercentage, { style: "pretty" }));

      // PARTIAL UPDATE #3: Status bar - update the entire status line
      yield* display(
        getCmdString(Cmd.cursorTo(statusBarStartCol, statusBarRow))
      );
      const statusBarContent = StatusBar(status, counter, timeStr).pipe(
        Box.alignHoriz(Box.center1, 80)
      );
      yield* display(
        Box.render(statusBarContent, {
          style: "pretty",
          partial: true,
        })
      );
    })
  );

  // Final completion message and cleanup
  yield* display(
    getCmdString(Cmd.cursorTo(progressBarStartCol, progressBarRow))
  );
  yield* display(
    Box.render(ProgressBar(COMPLETE, COMPLETE, PROGRESS_BAR_WIDTH), {
      style: "pretty",
      partial: true,
    })
  );
  yield* display(getCmdString(Cmd.cursorTo(0, 14)));
  yield* display(getCmdString(Cmd.cursorShow()));
  yield* Console.log("✅ Task completed successfully!");
});

Effect.runPromise(main);
