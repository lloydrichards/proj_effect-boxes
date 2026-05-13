---
"effect-boxes": minor
---

add `Cmd.altScreenEnter` and `Cmd.altScreenLeave` for alternate screen buffer support, closes #56

```typescript
import * as Box from "effect-boxes/Box"
import * as Cmd from "effect-boxes/Cmd"

// Switch to alternate screen, render content, then restore main screen on exit
const enter = Box.combineAll([Cmd.altScreenEnter, Cmd.cursorHide])
const layout = Box.text("Full-screen interactive content")
const exit = Box.combineAll([Cmd.altScreenLeave, Cmd.cursorShow])
```
