# effect-boxes

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
