---
"effect-boxes": minor
---

Add Layout module (Flex, Container, Grid), closes #63

Higher-level layout combinators built on top of Box for proportional space distribution, container-aware rendering, and grid layouts. All functions are pure and return standard `Box` values, composable with existing primitives like `border`, `annotate`, and `pad`.

- `Flex.row` / `Flex.col` distribute space among fixed, grow, and fill children proportionally with remainder-fair rounding
- `Flex.spacer` pushes adjacent children apart (like CSS `flex-grow` on an empty element)
- `Container.make` passes computed inner dimensions to a builder and enforces width on the output
- `Grid.make` arranges items in a fixed-column grid with uniform column width
- `Grid.auto` calculates column count from container width

All dual functions support both data-first and data-last (pipe) usage.

```typescript
import { pipe } from "effect"
import * as Box from "effect-boxes/Box"
import { Container, Flex, Grid } from "effect-boxes/Layout"

// Flex row with spacer
const header = Flex.row(
  [Flex.fixed(Box.text("Name:")), Flex.spacer(), Flex.fixed(Box.text("[ok]"))],
  80
)

// Container with padding and flex layout
const panel = Container.make({ width: 80, padding: 2 }, (ctx) =>
  Flex.row(
    [Flex.fixed(Box.text("sidebar")), Flex.grow(Box.text("main"))],
    ctx.innerWidth
  )
)

// Auto grid from container width
const grid = pipe(
  ["A", "B", "C", "D", "E", "F"].map(Box.text),
  Grid.auto(80, { minColWidth: 20 })
)
```
