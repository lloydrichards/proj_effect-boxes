/**
 * Demo script for VHS recording - showcases Effect Boxes features
 */
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

const Title = () =>
  Box.text("Effect Boxes").pipe(
    Box.annotate(Ansi.combine(Ansi.bold, Ansi.colorRGB(100, 180, 255))),
    Box.alignHoriz(Box.center1, 62)
  );

const Subtitle = () =>
  Box.text("Reactive Terminal UI Demo").pipe(
    Box.annotate(Ansi.dim),
    Box.alignHoriz(Box.center1, 62)
  );

const StatusBar = (status: string, counter: number, total: number) => {
  const statusColor = status === "completed" ? Ansi.green : Ansi.yellow;
  const statusBox = Box.punctuateH(
    [
      Box.text("Status:").pipe(Box.annotate(Ansi.dim)),
      Box.text(` ${status}`).pipe(Box.annotate(statusColor)),
    ],
    Box.left,
    Box.nullBox
  );

  const counterBox = Box.punctuateH(
    [
      Box.text("Progress:").pipe(Box.annotate(Ansi.dim)),
      Box.text(` ${counter}/${total}`).pipe(
        Box.annotate(counter === total ? Ansi.green : Ansi.cyan)
      ),
    ],
    Box.left,
    Box.nullBox
  );

  return pipe(
    [statusBox, counterBox],
    Box.punctuateH(Box.left, Box.text("    "))
  );
};

const ProgressBar = (progress: number, total: number, width: number) => {
  const ratio = Math.min(Math.max(progress / total, 0), 1);
  const filledLength = Math.round(ratio * width);
  const emptyLength = width - filledLength;

  const r = Math.round(255 * (1 - ratio));
  const g = Math.round(255 * ratio);
  const progressColor =
    progress === total ? Ansi.green : Ansi.colorRGB(r, g, 0);

  const filledBar = Box.text("\u2588".repeat(filledLength)).pipe(
    Box.annotate(progressColor)
  );
  const emptyBar = Box.text("\u2591".repeat(emptyLength)).pipe(
    Box.annotate(Ansi.dim)
  );
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

const Border = <A>(self: Box.Box<A>, color?: Ansi.AnsiAnnotation) => {
  const borderStyle = color ?? Ansi.dim;
  const middleBorder = pipe(
    Array.makeBy(self.rows, () => Box.char("\u2502")),
    Box.vcat(Box.left)
  ).pipe(Box.annotate(borderStyle));

  const topBorder = pipe(
    [
      Box.char("\u250c"),
      Box.text("\u2500".repeat(self.cols)),
      Box.char("\u2510"),
    ],
    Box.hcat(Box.top)
  ).pipe(Box.annotate(borderStyle));

  const bottomBorder = pipe(
    [
      Box.char("\u2514"),
      Box.text("\u2500".repeat(self.cols)),
      Box.char("\u2518"),
    ],
    Box.hcat(Box.top)
  ).pipe(Box.annotate(borderStyle));

  const middleSection = pipe(
    [middleBorder, self, middleBorder],
    Box.hcat(Box.top)
  );

  return pipe([topBorder, middleSection, bottomBorder], Box.vcat(Box.left));
};

const main = Effect.gen(function* () {
  yield* display(Box.renderPrettySync(Cmd.clearScreen));
  yield* display(Box.renderPrettySync(Cmd.cursorHide));

  const Complete = 100;
  const ProgressBarWidth = 50;

  const counterRef = yield* Ref.make(0);

  const buildDisplayLayout = (counter: number) => {
    const progress = Math.min(counter, Complete);
    const percentage = Math.round((progress / Complete) * 100);
    const status = counter >= Complete ? "completed" : "running";
    const isComplete = counter >= Complete;

    const progressSection = Box.hcat(
      [
        ProgressBar(counter, Complete, ProgressBarWidth).pipe(
          Reactive.makeReactive("progress-bar"),
          (box) => Border(box)
        ),
        Box.text(`${percentage.toString().padStart(3)}%`).pipe(
          Box.alignHoriz(Box.right, 5),
          Box.annotate(isComplete ? Ansi.green : Ansi.blue),
          Reactive.makeReactive("percentage"),
          (box) => Border(box, Ansi.green)
        ),
      ],
      Box.center1
    ).pipe(Padding(1), (box) =>
      Border(box, isComplete ? Ansi.green : Ansi.dim)
    );

    const statusSection = StatusBar(status, counter, Complete).pipe(
      Box.alignHoriz(Box.center1, 61),
      Reactive.makeReactive("status-bar"),
      (box) => Border(box)
    );

    return Box.vcat(
      [
        Title(),
        Subtitle(),
        Box.nullBox,
        progressSection,
        Box.nullBox,
        statusSection,
      ],
      Box.center1
    );
  };

  // Display the initial layout
  const initialLayout = buildDisplayLayout(0);
  yield* display(Box.renderPrettySync(initialLayout));
  const positionMap = Reactive.getPositions(initialLayout);

  const tickStream = Stream.fromEffectRepeat(
    Effect.gen(function* () {
      const counter = yield* Ref.updateAndGet(counterRef, (n) => n + 1);
      return { counter };
    })
  ).pipe(
    Stream.schedule(Schedule.spaced("50 milli")),
    Stream.takeUntil(({ counter }) => counter >= Complete)
  );

  yield* Stream.runForEach(tickStream, ({ counter }) =>
    Effect.gen(function* () {
      const progress = Math.min(counter, Complete);
      const percentage = Math.round((progress / Complete) * 100);
      const status = counter >= Complete ? "completed" : "running";
      const isComplete = counter >= Complete;

      const updates = pipe(
        [
          pipe(
            positionMap,
            Reactive.cursorToReactive("progress-bar"),
            Option.map((cursorCmd) => [
              cursorCmd,
              ProgressBar(counter, Complete, ProgressBarWidth),
            ])
          ),
          pipe(
            positionMap,
            Reactive.cursorToReactive("percentage"),
            Option.map((cursorCmd) => [
              cursorCmd,
              Box.text(`${percentage.toString().padStart(3)}%`).pipe(
                Box.alignHoriz(Box.right, 5),
                Box.annotate(isComplete ? Ansi.green : Ansi.blue)
              ),
            ])
          ),
          pipe(
            positionMap,
            Reactive.cursorToReactive("status-bar"),
            Option.map((cursorCmd) => [
              cursorCmd,
              StatusBar(status, counter, Complete).pipe(
                Box.alignHoriz(Box.center1, 61)
              ),
            ])
          ),
        ],
        Array.filter(Option.isSome),
        Array.map((option) => option.value),
        Array.flatten
      );

      if (updates.length > 0) {
        yield* display(Box.renderPrettySync(Box.combineAll(updates)));
      }
    })
  );

  // Brief pause then show completion
  yield* Effect.sleep("200 milli");

  yield* display(
    Box.combineAll([
      Cmd.cursorNextLine(2),
      Cmd.cursorShow,
      Box.text("\nDone!\n").pipe(
        Box.annotate(Ansi.combine(Ansi.bold, Ansi.green))
      ),
    ]).pipe(Box.renderPrettySync)
  );
});

Effect.runPromise(main);
