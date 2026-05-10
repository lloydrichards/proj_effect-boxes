---
"effect-boxes": minor
---

Add `Ansi.colorHex` and `Ansi.bgColorHex` for building colors from hex strings, closes #45

Supports 3-digit shorthand, 6-digit, with or without `#` prefix, and is case-insensitive. Throws on invalid input.

```typescript
import { pipe } from "effect"
import * as Box from "effect-boxes/Box"
import * as Ansi from "effect-boxes/Ansi"

// Foreground from hex
const branded = pipe(
  Box.text("Acme Corp"),
  Box.annotate(Ansi.colorHex("#ff6600"))
)

// Background from hex
const highlight = pipe(
  Box.text("Important"),
  Box.annotate(Ansi.combine(Ansi.colorHex("#ffffff"), Ansi.bgColorHex("#8b5cf6")))
)

// Short-form hex
const short = Ansi.colorHex("#f60") // equivalent to #ff6600
```
