---
"effect-boxes": minor
---

add width and height constraint combinators for responsive terminal layouts, closes #44

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
