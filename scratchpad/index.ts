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
  const progressColor = Ansi.colorRGB(r, g, 0);

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
  yield* Console.log("Starting\n");

  const COMPLETE = 64;

  const counterRef = yield* Ref.make(0);

  const tickStream = Stream.repeatEffect(
    Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis;

      const counter = yield* Ref.updateAndGet(counterRef, (n) => n + 1);

      return { counter, timestamp: now };
    })
  ).pipe(
    Stream.schedule(Schedule.spaced("200 milli")),
    Stream.takeUntil(({ counter }) => counter >= COMPLETE)
  );

  yield* Stream.runForEach(tickStream, ({ counter, timestamp }) =>
    Effect.gen(function* () {
      yield* Console.clear;

      yield* Box.printBox(
        pipe(
          [
            ProgressBar(counter, COMPLETE, 69).pipe(Border),
            Box.text(`${((counter / COMPLETE) * 100).toFixed(0)}%`).pipe(
              Box.alignHoriz(Box.right, 5),
              Box.annotate(Ansi.blue),
              Border,
              Box.annotate(Ansi.green)
            ),
          ],
          Box.hcat(Box.center1),
          Padding(1),
          Border
        )
      );

      yield* Box.printBox(
        StatusBar(
          counter < COMPLETE ? "Running..." : "Completed!",
          counter,
          formatTime(timestamp)
        ).pipe(Box.alignHoriz(Box.center1, 80), Border)
      );

      if (counter < COMPLETE) {
        yield* Box.printBox(
          Box.punctuateH(
            [
              Box.text("Press"),
              Box.text("Ctrl+C").pipe(Box.annotate(Ansi.blue)),
              Box.text("to stop..."),
            ],
            Box.left,
            Box.text(" ")
          )
        );
      }
    })
  );

  yield* Console.log("\n ...Task completed successfully!");
});

Effect.runPromise(main);
