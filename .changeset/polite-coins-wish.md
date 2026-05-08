---
"effect-boxes": minor
---

Add Box.border() combinator and Box.pad() for box-model styling

- `Box.border()` supports five preset styles (single, double, rounded, thick, ascii) with optional annotation for colored borders. 
- `Box.pad()` provides CSS-like shorthand for adding space around content (uniform, vertical/horizontal, or per-side).

```typescript
import { pipe } from "effect"
import * as Box from "effect-boxes/Box"
import * as Ansi from "effect-boxes/Ansi"

const panel = pipe(
  Box.text("Hello"),
  Box.pad(1, 2),
  Box.border("rounded", { annotation: Ansi.cyan })
)

console.log(Box.renderPrettySync(panel))
// ╭─────────╮
// │         │
// │  Hello  │
// │         │
// ╰─────────╯
```
