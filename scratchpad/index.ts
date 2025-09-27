import {
  Array,
  Clock,
  Effect,
  Option,
  pipe,
  Ref,
  Schedule,
  Stream,
} from "effect";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";
import * as Cmd from "../src/Cmd";
import * as Reactive from "../src/Reactive";

const display = (msg: string) => Effect.sync(() => process.stdout.write(msg));

const StatusBar = (status: string, counter: number, time: string) =>
  pipe(
    [
      Box.text(`Status: ${status}`),
      Box.text(`Counter: ${counter}`),
      Box.text(`⏰ ${time}`),
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

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

const main = Effect.gen(function* () {
  // Clear screen and hide cursor for cleaner output
  yield* display(Box.render(Cmd.clearScreen, { style: "pretty" }));
  yield* display(Box.render(Cmd.cursorHide, { style: "pretty" }));

  const COMPLETE = 1000;
  const PROGRESS_BAR_WIDTH = 69;

  const counterRef = yield* Ref.make(0);

  // First, create the display layout (what the user sees)
  const buildDisplayLayout = (counter: number, timestamp: number) => {
    const progress = Math.min(counter, COMPLETE);
    const percentage = Math.round((progress / COMPLETE) * 100);
    const timeStr = formatTime(timestamp);
    const status = counter >= COMPLETE ? "completed" : "running";

    const top = Box.hcat(
      [
        ProgressBar(counter, COMPLETE, PROGRESS_BAR_WIDTH).pipe(
          Reactive.makeReactive("progress-bar"),
          Border
        ),
        Box.text(`${percentage.toString().padStart(3)}%`).pipe(
          Box.alignHoriz(Box.right, 5),
          Reactive.makeReactive("percentage"),
          Box.annotate(percentage === 100 ? Ansi.green : Ansi.blue),
          Border,
          Box.annotate(Ansi.green)
        ),
      ],
      Box.center1
    ).pipe(Padding(1), Border);

    const bottom = StatusBar(status, counter, timeStr).pipe(
      Box.alignHoriz(Box.center1, 79),
      Reactive.makeReactive("status-bar"),
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

    return Box.punctuateV([top, bottom, footer], Box.top, Box.char(" "));
  };

  // Display the initial layout
  const initialLayout = buildDisplayLayout(0, Date.now());
  yield* display(Box.render(initialLayout, { style: "pretty" }));
  const positionMap = Reactive.getPositions(initialLayout);

  const tickStream = Stream.repeatEffect(
    Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis;
      const counter = yield* Ref.updateAndGet(counterRef, (n) => n + 1);
      return { counter, timestamp: now };
    })
  ).pipe(
    Stream.schedule(Schedule.spaced("10 milli")),
    Stream.takeUntil(({ counter }) => counter >= COMPLETE)
  );

  // Process each tick with dynamic updates using reactive positions
  yield* Stream.runForEach(tickStream, ({ counter, timestamp }) =>
    Effect.gen(function* () {
      const progress = Math.min(counter, COMPLETE);
      const percentage = Math.round((progress / COMPLETE) * 100);
      const timeStr = formatTime(timestamp);
      const status = counter >= COMPLETE ? "completed" : "running";

      // Create update commands using position map and Array.filterMap
      const updates = pipe(
        [
          pipe(
            positionMap,
            Reactive.cursorToReactive("progress-bar"),
            Option.map((cursorCmd) => [
              cursorCmd,
              ProgressBar(counter, COMPLETE, PROGRESS_BAR_WIDTH),
            ])
          ),
          pipe(
            positionMap,
            Reactive.cursorToReactive("percentage"),
            Option.map((cursorCmd) => [
              cursorCmd,
              Box.text(`${percentage.toString().padStart(3)}%`).pipe(
                Box.alignHoriz(Box.right, 5),
                Box.annotate(percentage === 100 ? Ansi.green : Ansi.blue)
              ),
            ])
          ),
          pipe(
            positionMap,
            Reactive.cursorToReactive("status-bar"),
            Option.map((cursorCmd) => [
              cursorCmd,
              StatusBar(status, counter, timeStr).pipe(
                Box.alignHoriz(Box.center1, 79)
              ),
            ])
          ),
        ],
        // Filter out None values and flatten the update commands
        Array.filterMap((option) => option),
        Array.flatten
      );

      // Render all updates if we have any
      if (updates.length > 0) {
        yield* display(
          Box.render(Box.combineAll(updates), {
            style: "pretty",
            partial: true,
          })
        );
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
          Box.alignVert(Box.bottom, 5)
        )
      ),
      Box.render({ style: "pretty" })
    )
  );
});

Effect.runPromise(main);
