import { Clock, Effect, pipe, Ref, Schedule, Stream } from "effect";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";
import * as Cmd from "../src/Cmd";

const display = (msg: string) => Effect.sync(() => process.stdout.write(msg));

// --------------------------
// Vector utilities
// --------------------------
type Vec2 = { x: number; y: number };

const v = (x = 0, y = 0): Vec2 => ({ x, y });

const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });

const limit = (vec: Vec2, maxLength: number): Vec2 => {
  const length = Math.hypot(vec.x, vec.y);
  if (length <= maxLength) {
    return vec;
  }
  const scale = maxLength / length;
  return { x: vec.x * scale, y: vec.y * scale };
};

const wrap = (pos: Vec2, width: number, height: number): Vec2 => ({
  x: ((pos.x % width) + width) % width,
  y: ((pos.y % height) + height) % height,
});

// --------------------------
// Simplified noise function
// --------------------------
const simpleNoise = (x: number, y: number): number => {
  const hash = (n: number) => {
    const a = Math.sin(n * 12.9898) * 43_758.5453;
    return a - Math.floor(a);
  };

  // Get integer coordinates
  const ix = Math.floor(x);
  const iy = Math.floor(y);

  // Get fractional parts
  const fx = x - ix;
  const fy = y - iy;

  // Smooth interpolation function
  const smooth = (t: number) => t * t * (3 - 2 * t);

  // Hash the four corners
  const a = hash(ix + iy * 57);
  const b = hash(ix + 1 + iy * 57);
  const c = hash(ix + (iy + 1) * 57);
  const d = hash(ix + 1 + (iy + 1) * 57);

  // Interpolate
  const u = smooth(fx);
  const v = smooth(fy);
  const i1 = a + (b - a) * u;
  const i2 = c + (d - c) * u;

  return (i1 + (i2 - i1) * v) * 2 - 1; // Convert to [-1, 1]
};

type Walker = {
  pos: Vec2;
  vel: Vec2;
  symbol: string;
  color: Ansi.AnsiAnnotation;
};

type FlowFieldState = {
  walkers: Walker[];
};

const colors = [Ansi.cyan, Ansi.green, Ansi.magenta, Ansi.yellow, Ansi.blue];
const directions = ["←", "↖", "↑", "↗", "→", "↘", "↓", "↙"];

const Border = <A>(self: Box.Box<A>) => {
  const middleBorder = pipe(
    Array.from({ length: self.rows }, () => Box.char("│")),
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

const main = Effect.gen(function* () {
  // Clear screen and hide cursor for cleaner output
  yield* display(Box.render(Cmd.clearScreen, { style: "pretty" }));
  yield* display(Box.render(Cmd.cursorHide, { style: "pretty" }));

  // Terminal size and inner canvas
  const INNER_W = 100;
  const INNER_H = 16;

  // Flow field & walkers config
  const noise = simpleNoise;
  const noiseScale = 0.06;
  const timeSpeed = 0.0009;
  const strength = 0.25;
  const WALKERS = 10;
  const MAX_SPEED = 1;

  // Convert velocity to directional arrow
  const velocityToArrow = (vel: Vec2): string => {
    // If velocity is very small, use a dot
    if (Math.hypot(vel.x, vel.y) < 0.1) {
      return "·";
    }

    // Calculate angle in radians
    const angle = Math.atan2(vel.y, vel.x);

    // Convert to 8 directions (45-degree increments)
    const index = Math.round((angle + Math.PI) / (Math.PI / 4)) % 8;

    return directions[index] ?? "·";
  };

  // Initialize the initial state
  const initialWalkers: Walker[] = Array.from({ length: WALKERS }, (_, i) => ({
    pos: v(Math.random() * INNER_W, Math.random() * INNER_H),
    vel: v(0, 0),
    symbol: "·", // Will be updated to arrow based on velocity
    color: colors[i % colors.length] ?? Ansi.cyan,
  }));

  // Create Refs for state management
  const stateRef = yield* Ref.make<FlowFieldState>({
    walkers: initialWalkers,
  });

  // Pure function that creates a new state from the current state
  const stepWalkers = (ms: number, state: FlowFieldState): FlowFieldState => {
    const t = ms * timeSpeed;

    // Create new walkers array with updated positions and arrows
    const newWalkers = state.walkers.map((walker) => {
      // Get noise-based force
      const nx = (walker.pos.x + t * 1000) * noiseScale;
      const ny = (walker.pos.y + t * 777) * noiseScale;
      const angle = (noise(nx, ny) + 1) * Math.PI; // Convert [-1,1] to [0,2π]

      // Apply force and update velocity
      const force = v(Math.cos(angle) * strength, Math.sin(angle) * strength);
      const newVel = limit(add(walker.vel, force), MAX_SPEED);

      // Update position with wrapping
      const newPos = wrap(add(walker.pos, newVel), INNER_W, INNER_H);

      // Update symbol to show direction of movement
      const newSymbol = velocityToArrow(newVel);

      return {
        ...walker,
        pos: newPos,
        vel: newVel,
        symbol: newSymbol,
      };
    });

    return {
      walkers: newWalkers,
    };
  };

  // State management
  const counterRef = yield* Ref.make(0);

  const tickStream = Stream.repeatEffect(
    Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis;

      const counter = yield* Ref.updateAndGet(counterRef, (n) => n + 1);

      return { counter, timestamp: now };
    })
  ).pipe(
    Stream.schedule(Schedule.spaced("100 milli"))
    // Stream.takeUntil(({ counter }) => counter >= COMPLETE) // leave for debugging
  );

  // Render the initial layout
  yield* display(
    pipe(
      Box.emptyBox(INNER_H, INNER_W).pipe(Border),
      Box.vAppend(Box.text("Flow Field Walkers (Ctrl+C to exit)")),
      Box.render({ style: "pretty" })
    )
  );

  // Process each tick with partial updates
  yield* Effect.ensuring(
    Stream.runForEach(tickStream, ({ timestamp }) =>
      Effect.gen(function* () {
        // Update simulation state
        yield* Ref.update(stateRef, (state) => stepWalkers(timestamp, state));
        // Get current state and build content box
        const currentState = yield* Ref.get(stateRef);

        yield* display(
          pipe(
            Cmd.home,
            Box.combine<Ansi.AnsiStyle>(
              Box.combineAll(
                currentState.walkers.map((w) =>
                  pipe(
                    Cmd.cursorTo(Math.ceil(w.pos.x), Math.ceil(w.pos.y)),
                    Box.combine<Ansi.AnsiStyle>(
                      Box.char(w.symbol).pipe(
                        Box.annotate(Ansi.combine(w.color, Ansi.bold))
                      )
                    )
                  )
                )
              )
            ),
            Box.render({ style: "pretty", partial: true })
          )
        );
      })
    ),
    display(Box.render(Cmd.cursorShow, { style: "pretty" }))
  );

  yield* Effect.addFinalizer(() => {
    return display(
      pipe(
        // Ensure cursor is shown on exit
        Cmd.cursorShow,
        Box.combine(Cmd.home),
        Box.combine<Ansi.AnsiStyle>(
          Box.emptyBox(INNER_H * 2, INNER_W).pipe(Border)
        ),
        Box.render({ style: "pretty" })
      )
    );
  });
}).pipe(Effect.scoped);

Effect.runPromise(main);
