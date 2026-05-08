# Contributing to Effect Boxes

Thank you for your interest in contributing to Effect Boxes! This guide covers
everything you need to get started with development.

## Development Setup

### Option A: Nix (recommended)

The project includes a `flake.nix` that provides Bun, Node.js, and all other
tools automatically. Nothing else to install.

```bash
git clone https://github.com/lloydrichards/proj_effect-boxes.git
cd proj_effect-boxes

# If you use direnv (recommended alongside nix):
direnv allow

# Otherwise, enter the dev shell manually:
nix develop

# Then install dependencies
bun install
```

### Option B: Manual setup

Install these yourself:

- [Bun](https://bun.sh/) runtime
- Node.js 24+

```bash
git clone https://github.com/lloydrichards/proj_effect-boxes.git
cd proj_effect-boxes
bun install
```

## Development Commands

```bash
# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Type check
bun type-check

# Lint code
bun lint

# Format code
bun format

# Validate documentation
bun docs:check

# Run examples/scratchpad
bun run scratch
```

## Project Structure

```txt
src/
├── Box.ts          # Core Box data type and operations
├── Annotation.ts   # Text annotation system
├── Ansi.ts         # ANSI terminal styling
├── Cmd.ts          # Terminal control commands
├── Reactive.ts     # Position tracking for interactive UIs
└── Width.ts        # Text width calculations
tests/
├── box.test.ts     # Core Box tests
├── ansi.test.ts    # ANSI integration tests
└── *.test.ts       # Additional test suites
scratchpad/         # Development playground
docs/               # Module documentation
```

## Development Workflow

### Using the Scratchpad

The `scratchpad/` directory is your playground for experimenting with the
library:

```bash
# Create a test file
touch scratchpad/my-experiment.ts

# Run it
bun run scratchpad/my-experiment.ts

# Clean up when done
rm scratchpad/my-experiment.ts
```

### Running Specific Tests

```bash
# Run a single test file
bun test tests/box.test.ts

# Run tests matching a pattern
bun test --grep "alignment"
```

## Testing Guidelines

- Use regular `vitest` for pure functions that don't return Effect types
- Use `@effect/vitest` for functions that return Effect types
- Focus on testing mathematical properties and edge cases
- See existing tests in `tests/` for patterns

## Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting. Run
`bun lint` and `bun format` before committing.

Key conventions:

- Pure functions with immutable data
- Use `pipe()` for function composition
- Implement Effect interfaces (`Pipeable`, `Equal`, `Hash`) where appropriate
- All public functions need JSDoc with `@example` blocks

## Generating the Demo GIF

The demo GIF in the README is generated using
[VHS](https://github.com/charmbracelet/vhs):

```bash
# Install VHS (macOS)
brew install vhs

# Generate the demo GIF
vhs media/demo.tape
```

## Releasing a New Version

This project uses [changesets](https://github.com/changesets/changesets) for
versioning and publishing.

### Adding a Changeset

When making a noteworthy change, add a changeset:

```bash
bun changeset
```

Follow the prompts to:

1. Select a semver bump type (patch/minor/major)
2. Describe the change

This creates a markdown file in `.changeset/`.

### Release Process

1. **Commit the changeset** along with your code changes
2. **Push to `main`**: CI detects pending changesets and opens a "Version
   Packages" PR
3. **Merge the release PR**: This bumps `package.json`, updates `CHANGELOG.md`,
   and removes consumed changeset files
4. **Automatic publish**: After merging, CI publishes to npm automatically
5. **Verify**: Check
   [GitHub Actions](https://github.com/lloydrichards/proj_effect-boxes/actions)
   and [npm](https://www.npmjs.com/package/effect-boxes)

## Getting Help

- Check the [documentation](./docs/) for module guides
- Review [AGENTS.md](./AGENTS.md) for detailed coding patterns (useful for AI
  assistants)
- Open an issue for bugs or feature requests
