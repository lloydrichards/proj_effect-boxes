---
"effect-boxes": minor
---

add truncate to the Box module, closes #43

The `truncate` function allows you to shorten a box's content to fit within a specified width, with options for how the truncation is applied (e.g., left, right, or center). This is useful for ensuring that text or layouts do not exceed certain dimensions while still conveying as much information as possible.

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";

const long = Box.text("This is a very long piece of text");

pipe(long, Box.truncate(15, Box.left)); // "This is a very…"
pipe(long, Box.truncate(15, Box.right)); // "… piece of text"
pipe(long, Box.truncate(15, Box.center1)); // "This is…of text"
```
