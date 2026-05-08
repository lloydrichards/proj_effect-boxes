---
"effect-boxes": minor
---

Add bright ANSI color constants for both foreground (SGR 90-97) and background (SGR 100-107). Provides the full 16-color ANSI palette that users expect from TUI libraries.

```typescript
import { pipe } from "effect"
import * as Box from "effect-boxes/Box"
import * as Ansi from "effect-boxes/Ansi"

const alert = pipe(
  Box.text("Deprecated"),
  Box.annotate(Ansi.combine(Ansi.brightYellow, Ansi.bgBrightBlack))
)
console.log(Box.renderPrettySync(alert))
```

New exports: `brightBlack`, `brightRed`, `brightGreen`, `brightYellow`, `brightBlue`, `brightMagenta`, `brightCyan`, `brightWhite`, `bgBrightBlack`, `bgBrightRed`, `bgBrightGreen`, `bgBrightYellow`, `bgBrightBlue`, `bgBrightMagenta`, `bgBrightCyan`, `bgBrightWhite`.
