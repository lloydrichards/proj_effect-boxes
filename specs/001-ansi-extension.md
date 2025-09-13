# Spec 001: ANSI Extensions for Box Annotations

Status: Proposed Owner: lloyd Last updated: 2025-09-13

## Summary

Expand the `Ansi` module to support a richer, composable set of colors and text
styles that integrate with `Box` annotations, while maintaining backwards
compatibility and preserving layout correctness. This spec adds 16-color bright
palettes, 256-color and truecolor (24-bit) support, additional common text
attributes, and naming aligned with user preferences.

## Goals

- Provide comprehensive color support:
  - 8-color + 8 bright (16-color) palette
  - 256-color indices
  - Truecolor (24-bit RGB)
- Add commonly-used text attributes (bold, dim, italic, underline, blink,
  inverse, hidden, strikethrough, overline)
- Keep the API simple, composable, and compatible with existing
  `Ansi.combine(...)`
- Maintain ANSI-aware Box rendering (pretty vs plain) without affecting layout
  math
- Do not throw on invalid color inputs; wrap into valid ranges as specified

## Non-goals

- OSC hyperlinks, cursor control, screen modes, or other non-SGR features
- Terminal capability negotiation; callers choose rendering style (pretty/plain)
- "Off" attribute helpers for now (explicitly excluded)

## API Additions

### 1) Bright 16-color palette

Foreground (90–97):

- `redBright`, `greenBright`, `yellowBright`, `blueBright`, `magentaBright`,
  `cyanBright`, `whiteBright`, `blackBright`

Background (100–107):

- `bgRedBright`, `bgGreenBright`, `bgYellowBright`, `bgBlueBright`,
  `bgMagentaBright`, `bgCyanBright`, `bgWhiteBright`, `bgBlackBright`

Defaults (reset colors only, not attributes):

- `default` (39)
- `bgDefault` (49)

Notes:

- Naming follows user preference: `<color>Bright`, `bg<CapitalizedColor>Bright`
- Existing 30–37 / 40–47 constants remain unchanged

### 2) 256-color and Truecolor builders

- `color256(index: number)` → foreground SGR: `38;5;{n}`
- `bgColor256(index: number)` → background SGR: `48;5;{n}`
- `rgb(r: number, g: number, b: number)` → foreground SGR: `38;2;r;g;b`
- `bgRgb(r: number, g: number, b: number)` → background SGR: `48;2;r;g;b`

Validation semantics (no-throw wrapping):

- 256-color `index` is normalized by `index % 256` (e.g., 260 → 4)
- RGB channels `r`, `g`, `b` are normalized via modulo 256 (e.g., 300 → 44)

Conflict semantics:

- Extended FG replaces any prior FG; extended BG replaces any prior BG
  (last-wins), consistent with existing behavior

### 3) Additional text attributes

Add the following attributes (on-codes only):

- `bold` (1)
- `dim` (2)
- `italic` (3)
- `underlined` (4)
- `blink` (5)
- `inverse` (7)
- `hidden` (8)
- `strikethrough` (9)
- `overline` (53)
- `reset` (0)

Notes:

- Keep existing `bold`, `underlined`, `reset` exports
- No export of per-attribute "off" codes for now (e.g., 22, 23, 24, 25, 27, 28,
  29, 55)
- Rendering already emits a trailing full reset (0) per line

## Types and Internal Representation

- Keep `AnsiAnnotation = Annotation<AnsiStyleType>` and
  `CombinedAnsiAnnotation = Annotation<CombinedAnsiStyle>` unchanged
- Extend internal union to accommodate extended colors:
  - `ExtForegroundColor` { mode: "Index" | "RGB"; values: number[] }
  - `ExtBackgroundColor` { mode: "Index" | "RGB"; values: number[] }
- Maintain existing variants:
  - `ForegroundColor` | `BackgroundColor` (simple numeric codes)
  - `TextAttribute` (numeric codes)
- Conflict keys:
  - Both `ForegroundColor` and `ExtForegroundColor` map to key `Foreground`
  - Both `BackgroundColor` and `ExtBackgroundColor` map to key `Background`
  - `TextAttribute` keyed by attribute name as-is

### Escape sequence generation

- Flatten the combined styles into a single SGR string:
  - Simple codes: join as-is (e.g., `31;1`)
  - 256-index FG/BG: `38;5;n` / `48;5;n`
  - Truecolor FG/BG: `38;2;r;g;b` / `48;2;r;g;b`
- If no styles, produce empty string

## Rendering & Box Integration

- Pretty mode behavior unchanged: each rendered line is wrapped with the
  computed SGR and a trailing reset (0)
- Plain mode unchanged: no ANSI codes emitted
- Keep ANSI-aware padding/truncation (visible length ignores SGR)
- Box alignment, merging, para flow unchanged

## Backward Compatibility

- All existing exports and behavior preserved
- `Ansi.combine` continues to support both simple and extended variants with
  last-wins semantics for FG/BG
- Existing tests remain valid

## Examples

```ts
// Bright palette
Box.text("Title").pipe(Box.annotate(Ansi.cyanBright));

// 256-color
Box.text("Heat").pipe(Box.annotate(Ansi.color256(196)));

// Truecolor
Box.text("Brand").pipe(Box.annotate(Ansi.rgb(12, 34, 56)));

// Composed
const style = Ansi.combine(
  Ansi.rgb(200, 100, 50),
  Ansi.bgColor256(236),
  Ansi.bold,
  Ansi.italic
);
Box.text("Banner").pipe(Box.annotate(style));

// Reset to defaults for just colors
Box.text("Normal colors").pipe(Box.annotate(Ansi.default));
Box.text("Normal bg").pipe(Box.annotate(Ansi.bgDefault));
```

## Validation Rules (No-throw wrapping)

- 256-color index: `n = ((index % 256) + 256) % 256` (handles negatives)
- RGB channels: `c = ((channel % 256) + 256) % 256` for r, g, b

## Testing Strategy

- Unit tests (vitest) for:
  - Bright constants produce correct codes
  - `default`/`bgDefault` codes 39/49
  - `color256`/`bgColor256` wrapping and SGR formatting
  - `rgb`/`bgRgb` wrapping and SGR formatting
  - Conflict resolution across simple/256/RGB FG and BG
  - Additional attributes coexist and order stabilizes in combined SGR
- Box integration tests:
  - Pretty vs plain behavior with 256/RGB
  - ANSI-aware truncation/padding with long lines containing 256/RGB
  - Complex layouts combining multiple annotated boxes

## Documentation

- Update README with examples for bright, 256-color, and RGB usage
- Note terminal support caveats: blink/non-standard behaviors may vary
- Add scratchpad examples demonstrating a palette grid and brand colors

## Implementation Plan (Phases)

1. Types & internals:
   - Add extended color variants
   - Update conflict keys and SGR generation
2. Public API:
   - Add bright constants and defaults
   - Implement `color256`, `bgColor256`, `rgb`, `bgRgb` with modulo wrapping
   - Add additional attribute constants
3. Tests:
   - Unit + integration coverage per Testing Strategy
4. Docs & examples:
   - README update; scratchpad snippets
5. Verify:
   - Type-check, lint/format, tests green

## Notes

- Scope includes features commonly found in established ANSI libraries (chalk,
  kleur, picocolors, etc.), aligning naming with the project’s style and user
  preferences.
- We intentionally omit off-codes and non-SGR features to keep the API lean and
  focused on styling text content inside `Box`.
