# effect-boxes

## 0.13.0

### Minor Changes

- [#52](https://github.com/lloydrichards/effect-boxes/pull/52) [`70ebe56`](https://github.com/lloydrichards/effect-boxes/commit/70ebe56c616d4a507f236c9fe06cc550670b2100) Thanks [@lloydrichards](https://github.com/lloydrichards)! - add truncate to the Box module, closes [#43](https://github.com/lloydrichards/proj_effect-boxes/issues/43)

  The `truncate` function allows you to shorten a box's content to fit within a specified width, with options for how the truncation is applied (e.g., left, right, or center). This is useful for ensuring that text or layouts do not exceed certain dimensions while still conveying as much information as possible.

  ```typescript
  import { pipe } from "effect";
  import * as Box from "effect-boxes/Box";

  const long = Box.text("This is a very long piece of text");

  pipe(long, Box.truncate(15, Box.left)); // "This is a very…"
  pipe(long, Box.truncate(15, Box.right)); // "… piece of text"
  pipe(long, Box.truncate(15, Box.center1)); // "This is…of text"
  ```

- [#53](https://github.com/lloydrichards/effect-boxes/pull/53) [`98229e8`](https://github.com/lloydrichards/effect-boxes/commit/98229e890385047f80b1db08aecf900df275f0f5) Thanks [@lloydrichards](https://github.com/lloydrichards)! - add width and height constraint combinators for responsive terminal layouts, closes [#44](https://github.com/lloydrichards/proj_effect-boxes/issues/44)

  Four new functions enforce minimum and maximum dimensions on a box:

  - Box.minWidth(n) -- pads with spaces to ensure at least n columns
  - Box.maxWidth(n) -- hard-truncates lines exceeding n columns
  - Box.minHeight(n) -- pads with blank rows to ensure at least n rows
  - Box.maxHeight(n) -- keeps only the first n rows

  All support both data-first and data-last (pipe) usage via dual.

  ```typescript
  import { pipe } from "effect";
  import * as Box from "effect-boxes/Box";

  // Clamp a box to fit a 40x10 panel
  const panel = pipe(
    Box.text("Hello World"),
    Box.minWidth(40),
    Box.maxHeight(10)
  );
  // Combine with truncate for ellipsis on overflow
  const capped = pipe(
    Box.text("A".repeat(80)),
    Box.truncate(40, Box.left),
    Box.minWidth(60)
  );
  ```

  Internally, maxWidth and Box.truncate now share a truncateWidth helper that handles the recursive box tree-walk, reducing code duplication.

- [#54](https://github.com/lloydrichards/effect-boxes/pull/54) [`b5fb7d5`](https://github.com/lloydrichards/effect-boxes/commit/b5fb7d536a45dd6dd00b3c1a86e8c31f6357e0b3) Thanks [@lloydrichards](https://github.com/lloydrichards)! - Add `Ansi.colorHex` and `Ansi.bgColorHex` for building colors from hex strings, closes [#45](https://github.com/lloydrichards/proj_effect-boxes/issues/45)

  Supports 3-digit shorthand, 6-digit, with or without `#` prefix, and is case-insensitive. Throws on invalid input.

  ```typescript
  import { pipe } from "effect";
  import * as Box from "effect-boxes/Box";
  import * as Ansi from "effect-boxes/Ansi";

  // Foreground from hex
  const branded = pipe(
    Box.text("Acme Corp"),
    Box.annotate(Ansi.colorHex("#ff6600"))
  );

  // Background from hex
  const highlight = pipe(
    Box.text("Important"),
    Box.annotate(
      Ansi.combine(Ansi.colorHex("#ffffff"), Ansi.bgColorHex("#8b5cf6"))
    )
  );

  // Short-form hex
  const short = Ansi.colorHex("#f60"); // equivalent to #ff6600
  ```

- [#50](https://github.com/lloydrichards/effect-boxes/pull/50) [`2fb2ddd`](https://github.com/lloydrichards/effect-boxes/commit/2fb2dddaafec6c632becba3634b3ed1569ae9b30) Thanks [@lloydrichards](https://github.com/lloydrichards)! - add selective border sides via `sides` option on `Box.border()` closes [#42](https://github.com/lloydrichards/proj_effect-boxes/issues/42)

  Control which sides of the border are drawn by passing a `sides` object with `top`, `right`, `bottom`, and `left` booleans (all default to `true`).

  ```typescript
  import { pipe } from "effect";
  import * as Box from "effect-boxes/Box";

  const tab = pipe(
    Box.text("Tab"),
    Box.pad(0, 1),
    Box.border("rounded", { sides: { bottom: false } })
  );
  console.log(Box.renderPlainSync(tab));
  // ╭─────╮
  // │ Tab │

  const ruled = pipe(
    Box.text("Section"),
    Box.border("single", { sides: { left: false, right: false } })
  );
  console.log(Box.renderPlainSync(ruled));
  // ───────
  // Section
  // ───────
  ```

## 0.12.0

### Minor Changes

- [#46](https://github.com/lloydrichards/effect-boxes/pull/46) [`367f161`](https://github.com/lloydrichards/effect-boxes/commit/367f161ebf20e26900ffca08c1b3f2d1da4834e7) Thanks [@lloydrichards](https://github.com/lloydrichards)! - Add bright ANSI color constants for both foreground (SGR 90-97) and background (SGR 100-107).

  Provides the full 16-color ANSI palette that users expect from TUI libraries.

  ```typescript
  import { pipe } from "effect";
  import * as Box from "effect-boxes/Box";
  import * as Ansi from "effect-boxes/Ansi";
  const alert = pipe(
    Box.text("Deprecated"),
    Box.annotate(Ansi.combine(Ansi.brightYellow, Ansi.bgBrightBlack))
  );
  console.log(Box.renderPrettySync(alert));
  ```

  New exports: `brightBlack`, `brightRed`, `brightGreen`, `brightYellow`, `brightBlue`, `brightMagenta`, `brightCyan`, `brightWhite`, `bgBrightBlack`, `bgBrightRed`, `bgBrightGreen`, `bgBrightYellow`, `bgBrightBlue`, `bgBrightMagenta`, `bgBrightCyan`, `bgBrightWhite`

- [#46](https://github.com/lloydrichards/effect-boxes/pull/46) [`660f34f`](https://github.com/lloydrichards/effect-boxes/commit/660f34fc93a15bbe00c9adb15b6a3eb5a2b1e802) Thanks [@lloydrichards](https://github.com/lloydrichards)! - Add Box.border() combinator and Box.pad() for box-model styling

  - `Box.border()` supports five preset styles (single, double, rounded, thick, ascii) with optional annotation for colored borders.
  - `Box.pad()` provides CSS-like shorthand for adding space around content (uniform, vertical/horizontal, or per-side).

  ```typescript
  import { pipe } from "effect";
  import * as Box from "effect-boxes/Box";
  import * as Ansi from "effect-boxes/Ansi";

  const panel = pipe(
    Box.text("Hello"),
    Box.pad(1, 2),
    Box.border("rounded", { annotation: Ansi.cyan })
  );

  console.log(Box.renderPrettySync(panel));
  // ╭─────────╮
  // │         │
  // │  Hello  │
  // │         │
  // ╰─────────╯
  ```

- [#46](https://github.com/lloydrichards/effect-boxes/pull/46) [`367f161`](https://github.com/lloydrichards/effect-boxes/commit/367f161ebf20e26900ffca08c1b3f2d1da4834e7) Thanks [@lloydrichards](https://github.com/lloydrichards)! - Add bright ANSI color constants for both foreground (SGR 90-97) and background (SGR 100-107). Provides the full 16-color ANSI palette that users expect from TUI libraries.

  ```typescript
  import { pipe } from "effect";
  import * as Box from "effect-boxes/Box";
  import * as Ansi from "effect-boxes/Ansi";

  const alert = pipe(
    Box.text("Deprecated"),
    Box.annotate(Ansi.combine(Ansi.brightYellow, Ansi.bgBrightBlack))
  );
  console.log(Box.renderPrettySync(alert));
  ```

  New exports: `brightBlack`, `brightRed`, `brightGreen`, `brightYellow`, `brightBlue`, `brightMagenta`, `brightCyan`, `brightWhite`, `bgBrightBlack`, `bgBrightRed`, `bgBrightGreen`, `bgBrightYellow`, `bgBrightBlue`, `bgBrightMagenta`, `bgBrightCyan`, `bgBrightWhite`.

### Patch Changes

- [#39](https://github.com/lloydrichards/effect-boxes/pull/39) [`3ea3f8b`](https://github.com/lloydrichards/effect-boxes/commit/3ea3f8bd033b386413135357350e227c4404182e) Thanks [@lloydrichards](https://github.com/lloydrichards)! - revert changes to emoji detection to use RGI_Emoji

- [#40](https://github.com/lloydrichards/effect-boxes/pull/40) [`ef7bae8`](https://github.com/lloydrichards/effect-boxes/commit/ef7bae82de1506b7719fb07e8468ca8032a9bfa7) Thanks [@lloydrichards](https://github.com/lloydrichards)! - make effect a peer dependency of effect-boxes

## 0.11.2

### Patch Changes

- [#38](https://github.com/lloydrichards/effect-boxes/pull/38) [`e836567`](https://github.com/lloydrichards/effect-boxes/commit/e836567a7695f2af158dd932008c145e2ca90b5b) Thanks [@lloydrichards](https://github.com/lloydrichards)! - downgrade ts target to es2022 and replace RGI_Emoji with isEmoji predicate

- [#36](https://github.com/lloydrichards/effect-boxes/pull/36) [`9bbe17a`](https://github.com/lloydrichards/effect-boxes/commit/9bbe17ac9f7ffae6e43247732e1ec7a08872a1dc) Thanks [@lloydrichards](https://github.com/lloydrichards)! - fix multiple cmd being combined, ansi still renders even with empty box

## 0.11.1

### Patch Changes

- [#35](https://github.com/lloydrichards/effect-boxes/pull/35) [`8bded20`](https://github.com/lloydrichards/effect-boxes/commit/8bded20dce68e1ef1989dee7565921dd1a50041b) Thanks [@lloydrichards](https://github.com/lloydrichards)! - improve documentation and fix example snippets

- [#33](https://github.com/lloydrichards/effect-boxes/pull/33) [`28de02a`](https://github.com/lloydrichards/effect-boxes/commit/28de02a9931f487aefae92cf02f998da05f138d7) Thanks [@lloydrichards](https://github.com/lloydrichards)! - improve jsdocs for public facing APIs

- [#33](https://github.com/lloydrichards/effect-boxes/pull/33) [`6f3d066`](https://github.com/lloydrichards/effect-boxes/commit/6f3d066fd84fdb6f718df320006cb3204659ac81) Thanks [@lloydrichards](https://github.com/lloydrichards)! - fixed JSDOCs and API references

## 0.11.0

### Minor Changes

- [#30](https://github.com/lloydrichards/effect-boxes/pull/30) [`a157024`](https://github.com/lloydrichards/effect-boxes/commit/a1570242f6070f122123f6cec8a76bf177559d3f) Thanks [@lloydrichards](https://github.com/lloydrichards)! - add clearLines command for clearing lines

## 0.10.3

### Patch Changes

- [#28](https://github.com/lloydrichards/proj_effect-boxes/pull/28) [`a1b107f`](https://github.com/lloydrichards/proj_effect-boxes/commit/a1b107f9d48a3624e3847294095d7473ad2eadce) Thanks [@lloydrichards](https://github.com/lloydrichards)! - use bracket notation and RegExp constructor

## 0.10.2

### Patch Changes

- [#26](https://github.com/lloydrichards/proj_effect-boxes/pull/26) [`a780214`](https://github.com/lloydrichards/proj_effect-boxes/commit/a780214e1e699ac9a76100fa3389d975192e5b1b) Thanks [@lloydrichards](https://github.com/lloydrichards)! - explicitly mark optional properties as undefined

## 0.10.1

### Patch Changes

- [#24](https://github.com/lloydrichards/proj_effect-boxes/pull/24) [`324f201`](https://github.com/lloydrichards/proj_effect-boxes/commit/324f2017069622f37a70320ece25af6eb52eca50) Thanks [@lloydrichards](https://github.com/lloydrichards)! - bump effect to v4.0.0-beta.59

## 0.10.0

### Minor Changes

- [#18](https://github.com/lloydrichards/proj_effect-boxes/pull/18) [`5ead701`](https://github.com/lloydrichards/proj_effect-boxes/commit/5ead701380cd5adc2da5fc9c11668204339e5f9c) Thanks [@lloydrichards](https://github.com/lloydrichards)! - make Box yieldable and add tracked method to Renderer

- [#19](https://github.com/lloydrichards/proj_effect-boxes/pull/19) [`b5d813c`](https://github.com/lloydrichards/proj_effect-boxes/commit/b5d813c7b627574a034518b82e95db50751723c7) Thanks [@lloydrichards](https://github.com/lloydrichards)! - publish on npm
