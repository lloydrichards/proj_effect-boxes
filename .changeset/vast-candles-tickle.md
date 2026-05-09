---
"effect-boxes": minor
---

add selective border sides via `sides` option on `Box.border()` closes #42

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
