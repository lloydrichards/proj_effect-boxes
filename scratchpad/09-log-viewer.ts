import { BunServices } from "@effect/platform-bun";
import {
  Data,
  Duration,
  Effect,
  Fiber,
  pipe,
  Ref,
  Schedule,
  Stream,
  Terminal,
} from "effect";
import { Prompt } from "effect/unstable/cli";
import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";
import * as Cmd from "../src/Cmd";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type LogViewerState = {
  readonly lines: ReadonlyArray<string>;
  readonly scrollOffset: number;
  readonly autoScroll: boolean;
};

interface LogViewerOptions {
  readonly title: string;
  readonly height?: number;
  readonly stream: Stream.Stream<string>;
}

const Action = Data.taggedEnum<Prompt.ActionDefinition>();

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const DEFAULT_HEIGHT = 16;

const getTermWidth = (): number => {
  try {
    return process.stdout.columns ?? 80;
  } catch {
    return 80;
  }
};

// ----------------------------------------------------------------------------
// Rendering
// ----------------------------------------------------------------------------

const renderLayout = (
  state: LogViewerState,
  title: string,
  height: number,
  submitted: boolean
) =>
  Effect.gen(function* () {
    const terminal = yield* Terminal.Terminal;
    const termWidth = yield* terminal.columns;
    const innerWidth = termWidth - 4; // border + padding

    if (submitted) {
      return Box.hsep(
        [
          Box.text("✔").pipe(Box.annotate(Ansi.green)),
          Box.text(title).pipe(Box.annotate(Ansi.bold)),
          Box.text(`(${state.lines.length} lines)`).pipe(
            Box.annotate(Ansi.dim)
          ),
        ],
        1,
        Box.top
      );
    }

    // Compute visible window
    const totalLines = state.lines.length;
    const visibleLines = state.lines.slice(
      state.scrollOffset,
      state.scrollOffset + height
    );

    // Build content box
    const contentBox =
      visibleLines.length === 0
        ? Box.text("Waiting for log data...").pipe(Box.annotate(Ansi.dim))
        : pipe(
            visibleLines.map((line) => colorLogLine(line)),
            (boxes) => Box.vcat(boxes, Box.left)
          );

    // Apply constraints: fixed height, max width with truncation
    const constrainedContent = pipe(
      contentBox,
      Box.minHeight(height),
      Box.maxHeight(height),
      Box.minWidth(innerWidth),
      Box.truncate(innerWidth, Box.left)
    );

    // Header
    const header = Box.hsep(
      [
        Box.text(`  ${title}`).pipe(Box.annotate(Ansi.bold)),
        Box.text(
          `[${Math.min(state.scrollOffset + 1, totalLines)}–${Math.min(state.scrollOffset + height, totalLines)} / ${totalLines}]`
        ).pipe(Box.annotate(Ansi.dim)),
      ],
      1,
      Box.top
    );

    // Footer
    const scrollIndicator = state.autoScroll
      ? Box.text("AUTO").pipe(Box.annotate(Ansi.green))
      : Box.text("MANUAL").pipe(Box.annotate(Ansi.yellow));

    const footer = Box.hsep(
      [
        Box.text("  ↑/↓ scroll").pipe(Box.annotate(Ansi.dim)),
        Box.text("·").pipe(Box.annotate(Ansi.dim)),
        scrollIndicator,
        Box.text("·").pipe(Box.annotate(Ansi.dim)),
        Box.text("enter exit").pipe(Box.annotate(Ansi.dim)),
      ],
      1,
      Box.top
    );

    return Box.vcat(
      [
        header,
        constrainedContent.pipe(Box.pad(0, 1), Box.border("rounded")),
        footer,
      ],
      Box.left
    );
  });

// Simple log-level coloring
const colorLogLine = (line: string): Box.Box<Ansi.AnsiStyle> => {
  if (line.includes("[ERROR]") || line.includes("[FATAL]")) {
    return Box.text(line).pipe(Box.annotate(Ansi.red));
  }
  if (line.includes("[WARN]")) {
    return Box.text(line).pipe(Box.annotate(Ansi.yellow));
  }
  if (line.includes("[DEBUG]")) {
    return Box.text(line).pipe(Box.annotate(Ansi.dim));
  }
  if (line.includes("[INFO]")) {
    return Box.text(line).pipe(Box.annotate(Ansi.cyan));
  }
  return Box.text(line);
};

// ----------------------------------------------------------------------------
// LogViewer Prompt
// ----------------------------------------------------------------------------

export const LogViewer = ({
  title,
  height = DEFAULT_HEIGHT,
  stream,
}: LogViewerOptions) => {
  return Effect.gen(function* () {
    // Shared ref for accumulated log lines
    const linesRef = yield* Ref.make<ReadonlyArray<string>>([]);

    // Fork background fiber to consume stream
    const fiber = yield* Stream.runForEach(stream, (line) =>
      Ref.update(linesRef, (lines) => [...lines, line])
    ).pipe(Effect.forkChild);

    const prompt = Prompt.custom<LogViewerState, string>(
      {
        lines: [],
        scrollOffset: 0,
        autoScroll: true,
      },
      {
        render: (
          _state: LogViewerState,
          action: Prompt.Action<LogViewerState, string>
        ) =>
          Action.$match(action, {
            Beep: () => Effect.succeed(""),

            NextFrame: ({ state: nextState }) =>
              Effect.gen(function* () {
                const layout = yield* renderLayout(
                  nextState,
                  title,
                  height,
                  false
                );
                return Box.renderPrettySync(layout);
              }),

            Submit: () =>
              Effect.gen(function* () {
                const layout = yield* renderLayout(
                  { lines: [], scrollOffset: 0, autoScroll: true },
                  title,
                  height,
                  true
                );
                return Box.renderPrettySync(
                  layout.pipe(Box.vAppend<Ansi.AnsiStyle>(Box.text("")))
                );
              }),
          }),

        process: (input, state) =>
          Effect.gen(function* () {
            // Read latest lines from the background fiber
            const currentLines = yield* Ref.get(linesRef);
            const maxOffset = Math.max(0, currentLines.length - height);

            // Base state with latest lines
            const base: LogViewerState = {
              ...state,
              lines: currentLines as string[],
            };

            switch (input.key.name) {
              case "up": {
                const newOffset = Math.max(0, base.scrollOffset - 1);
                return Action.NextFrame({
                  state: {
                    ...base,
                    scrollOffset: newOffset,
                    autoScroll: false,
                  },
                });
              }

              case "down": {
                const newOffset = Math.min(maxOffset, base.scrollOffset + 1);
                const atBottom = newOffset >= maxOffset;
                return Action.NextFrame({
                  state: {
                    ...base,
                    scrollOffset: newOffset,
                    autoScroll: atBottom,
                  },
                });
              }

              case "enter":
              case "return":
                return Action.Submit({ value: "done" });

              default: {
                const offset = base.autoScroll
                  ? maxOffset
                  : Math.min(base.scrollOffset, maxOffset);
                return Action.NextFrame({
                  state: { ...base, scrollOffset: offset },
                });
              }
            }
          }),

        clear: (state: LogViewerState, _action) =>
          Effect.gen(function* () {
            const layout = yield* renderLayout(state, title, height, false);

            return Box.renderPrettySync(Cmd.clearLines(layout.rows));
          }),
      }
    );

    const result = yield* prompt;

    // Clean up background fiber
    yield* Fiber.interrupt(fiber);

    return result;
  });
};

// ----------------------------------------------------------------------------
// Demo: Fake log stream
// ----------------------------------------------------------------------------

const logMessages = [
  "[INFO]  Application starting up...",
  "[INFO]  Loading configuration from /etc/app/config.yaml",
  "[DEBUG] Config keys found: database, cache, auth, logging",
  "[INFO]  Connecting to PostgreSQL at db.internal:5432",
  "[INFO]  Database connection established (pool: 10)",
  "[INFO]  Initializing Redis cache at cache.internal:6379",
  "[WARN]  Redis connection slow (latency: 120ms > threshold: 100ms)",
  "[INFO]  Cache warmed with 1,247 entries",
  "[INFO]  Starting HTTP server on :8080",
  "[INFO]  Registered 24 API routes",
  "[DEBUG] Route: GET  /api/v1/users",
  "[DEBUG] Route: POST /api/v1/users",
  "[DEBUG] Route: GET  /api/v1/users/:id",
  "[DEBUG] Route: PUT  /api/v1/users/:id",
  "[INFO]  Health check endpoint: /healthz",
  "[INFO]  Server ready, accepting connections",
  "[INFO]  Incoming request: GET /api/v1/users (client: 10.0.1.42)",
  "[INFO]  Response: 200 OK (23ms)",
  "[WARN]  Rate limit approaching for client 10.0.1.42 (85/100 req/min)",
  "[INFO]  Incoming request: POST /api/v1/users (client: 10.0.1.55)",
  "[INFO]  Response: 201 Created (45ms)",
  "[ERROR] Query timeout: SELECT * FROM analytics WHERE date > '2024-01-01'",
  "[WARN]  Retrying query (attempt 2/3)...",
  "[INFO]  Query succeeded on retry (1,203ms)",
  "[INFO]  Incoming request: GET /api/v1/users/42 (client: 10.0.1.42)",
  "[INFO]  Cache HIT for user:42",
  "[INFO]  Response: 200 OK (2ms)",
  "[DEBUG] GC pause: 12ms (heap: 245MB / 512MB)",
  "[INFO]  Scheduled job: cleanup_sessions started",
  "[INFO]  Cleaned 342 expired sessions",
  "[WARN]  Disk usage at 78% on /var/data",
  "[INFO]  Incoming request: PUT /api/v1/users/42 (client: 10.0.1.42)",
  "[INFO]  Response: 200 OK (31ms)",
  "[ERROR] Connection reset by peer: cache.internal:6379",
  "[WARN]  Redis reconnecting (attempt 1/5)...",
  "[INFO]  Redis reconnected successfully",
  "[INFO]  Cache re-synced (delta: 23 entries)",
  "[INFO]  Incoming request: GET /api/v1/users?page=2 (client: 10.0.1.88)",
  "[INFO]  Response: 200 OK (18ms)",
  "[FATAL] Out of memory: heap limit reached (512MB)",
  "[INFO]  Initiating graceful shutdown...",
  "[INFO]  Draining 3 active connections...",
  "[INFO]  All connections drained",
  "[INFO]  Closing database pool...",
  "[INFO]  Database pool closed",
  "[INFO]  Shutdown complete",
];

const fakeLogStream: Stream.Stream<string> = pipe(
  Stream.fromIterable(logMessages),
  Stream.schedule(Schedule.spaced(Duration.millis(300)))
);

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

export const main = LogViewer({
  title: "Application Logs",
  height: 10,
  stream: fakeLogStream,
}).pipe(Effect.provide(BunServices.layer));
