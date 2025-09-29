# Standard JSDoc Documentation Guidelines

> **Authority**: This document is the authoritative source for JSDoc documentation standards in the effect-boxes library. It follows Effect.js ecosystem patterns while maintaining compatibility with the Box layout library's specific needs.

## 🎯 Core Principles

### 1. Compilation First
- **All examples MUST compile** via `bun run type-check`
- **No `any` types, type assertions, or unsafe patterns**
- **Type-safe examples only** - leverage TypeScript's inference

### 2. Effect.js Ecosystem Alignment
- Follow Effect.js documentation patterns from `effect-smol` repository
- Use consistent categorization and tagging
- Emphasize functional composition and immutability

### 3. Practical Examples
- **Real-world usage scenarios** over abstract examples
- **Multiple examples** showing different usage patterns
- **Functional composition** using `pipe()` for complex operations

### 4. Mathematical Clarity
- **Preserve existing Haskell references** using `@note Haskell:` format
- **Include mathematical properties** where relevant (associativity, identity)
- **Bridge concepts** for developers with varying mathematical backgrounds

## ✍️ Description Best Practices

### Writing Clear Descriptions

**Core Guidelines:**
- **Start with action verbs**: "Creates", "Combines", "Transforms", "Validates"
- **Be specific about behavior**: Include edge cases and important side effects
- **Use present tense**: "Calculates the result" not "Will calculate the result"
- **Keep primary description to 1-2 sentences**: More details go in **Details** section

### Cognitive Load Principles

**Information Hierarchy:**
1. **Essential function** (what it does)
2. **Key behavior** (how it behaves) 
3. **Important constraints** (edge cases, performance)
4. **Mathematical context** (when applicable)

```typescript
// ✅ GOOD: Clear, action-oriented, specific
/**
 * Horizontally concatenates boxes with specified vertical alignment.
 * 
 * Combines multiple boxes side-by-side, using alignment to handle
 * boxes of different heights. Returns a single box with combined width.
 * 
 * @note Haskell: `hcat :: Foldable f => Alignment -> f Box -> Box`
 */

// ❌ BAD: Vague, passive, unclear
/**
 * This function will take some boxes and put them together horizontally.
 */
```

### Mathematical Documentation Patterns

**Preserving Haskell References:**
- **Keep existing `@note Haskell:` format** - it's excellent and provides mathematical precision
- **Add mathematical properties** when they help understanding
- **Include type theory context** for complex operations
- **Bridge concepts** for developers learning functional programming

```typescript
/**
 * Combines two boxes using the semigroup operation.
 * 
 * **Mathematical Properties**
 * - **Associative**: `combine(combine(a, b), c) ≡ combine(a, combine(b, c))`
 * - **Identity**: `combine(nullBox, a) ≡ combine(a, nullBox) ≡ a`
 * 
 * @note Haskell: `(<>) :: Box -> Box -> Box`
 * @note Haskell: `instance Semigroup Box where l <> r = hcat top [l,r]`
 * 
 * @category combinators
 */
```

### Technical Accuracy Standards

**Include When Relevant:**
- **Performance characteristics**: For operations with non-trivial complexity
- **Error conditions**: What can go wrong and when
- **Side effects**: Mutations, logging, network calls (rare in this library)
- **Mathematical constraints**: Domain restrictions, invariants

```typescript
/**
 * Moves a box right by the specified number of columns.
 * 
 * **Details**
 * 
 * Creates a new box with increased width by prepending spaces to each line.
 * Negative distances will throw an error - use `moveLeft()` instead.
 * 
 * **Performance**: O(rows × content_length) for content copying
 * 
 * @note Haskell: `moveRight :: Int -> Box -> Box`
 */
```

### Structure for Complex Functions

**Use this pattern for advanced operations:**

```typescript
/**
 * Brief one-line summary.
 * 
 * **Details**
 * 
 * More comprehensive explanation including behavior notes,
 * when to use vs alternatives, and important constraints.
 * 
 * **Mathematical Properties** (when applicable)
 * - **Property Name**: Mathematical statement or description
 * 
 * **Type Theory** (when helpful)
 * ```haskell
 * functionName :: InputType -> OutputType
 * -- Additional Haskell context or constraints
 * ```
 * 
 * @note Haskell: `original :: signature -> here`
 * @category appropriate_category
 */
```

## 📋 Standard JSDoc Template

### Public Function Documentation

```typescript
/**
 * Brief one-line description of functionality.
 * 
 * **Details** (optional section for complex functions)
 * 
 * More comprehensive explanation including:
 * - Important behavior notes
 * - Performance characteristics  
 * - When to use vs alternatives
 *
 * **Example** (Basic usage)
 *
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * // Clear description of what this demonstrates
 * const result = Box.functionName(params)
 * console.log(Box.render(result))
 * // Expected output:
 * // "rendered box content"
 * ```
 *
 * **Example** (Pipeable composition - when applicable)
 *
 * ```typescript
 * import { pipe } from "effect"
 * import * as Box from "effect-boxes/Box"
 *
 * // Functional composition example
 * const layout = pipe(
 *   Box.text("Hello World"),
 *   Box.moveRight(5),
 *   Box.alignHoriz(Box.center1, 20)
 * )
 * ```
 *
 * @category constructors | combinators | utilities | transformations
 */
```

### Dual Function Documentation

```typescript
/**
 * Function supporting both data-first and data-last usage patterns.
 *
 * **Example** (Data-first usage)
 *
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const result = Box.functionName(box, param)
 * ```
 *
 * **Example** (Data-last with pipe)
 *
 * ```typescript
 * import { pipe } from "effect"
 * import * as Box from "effect-boxes/Box"
 *
 * const result = pipe(box, Box.functionName(param))
 * ```
 *
 * @category combinators
 */
export const functionName = dual<
  (param: Type) => (self: Box<A>) => Box<B>,
  (self: Box<A>, param: Type) => Box<B>
>(2, (self, param) => implementation)
```

### Internal Function Documentation

```typescript
/**
 * @internal
 */
export const simpleInternalFunction = implementation

// OR for complex internal functions:

/**
 * Internal helper for complex box operations.
 * 
 * @internal
 * @category utilities
 */
export const complexInternalFunction = implementation
```

## 🏷️ Category Classification

### Required Categories for effect-boxes

#### `@category constructors`
Functions that create new Box instances:
```typescript
// Box creation functions
text, emptyBox, char, nullBox, para, combine
```

#### `@category combinators`  
Functions that combine or transform existing boxes:
```typescript
// Box combination and layout functions
hcat, vcat, hAppend, vAppend, punctuateH, punctuateV
```

#### `@category transformations`
Functions that modify box properties or content:
```typescript
// Box modification functions
align*, move*, annotate, reAnnotate, alterAnnotations
```

#### `@category utilities`
Helper functions and property accessors:
```typescript
// Information and utility functions
rows, cols, render, match, isBox
```

#### `@category models` (for type definitions)
```typescript
// Type definitions and interfaces
export interface Box<A>
export type Alignment 
```

#### `@category guards` (for type guards)
```typescript
// Type checking functions
export const isBox: <A>(u: unknown) => u is Box<A>
```

## 📖 Import Standards

### Correct Import Patterns
```typescript
// ✅ CORRECT - Effect core imports
import { pipe, dual } from "effect"
import { Equal, Hash } from "effect"

// ✅ CORRECT - Local module imports
import * as Box from "effect-boxes/Box"
import * as Ansi from "effect-boxes/Ansi" 
import * as Annotation from "effect-boxes/Annotation"

// ✅ CORRECT - Relative imports within examples
import * as Box from "../Box"
```

### Forbidden Patterns
```typescript
// ❌ WRONG - Type assertions
const value = something as Box<string>

// ❌ WRONG - Any types
const data: any = someValue

// ❌ WRONG - Declare patterns  
declare const Service: any
```

## 🎯 Example Quality Standards

### Basic Function Example
```typescript
/**
 * Creates a box containing the specified text content.
 *
 * **Example**
 *
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const greeting = Box.text("Hello\nWorld")
 * console.log(`Dimensions: ${Box.rows(greeting)} x ${Box.cols(greeting)}`)
 * // Dimensions: 2 x 5
 * console.log(Box.render(greeting))
 * // Hello
 * // World
 * ```
 *
 * @note Haskell: `text :: String -> Box`
 * @category constructors
 */
```

### Complex Composition Example
```typescript
/**
 * Horizontally concatenates boxes with specified vertical alignment.
 *
 * **Details**
 * 
 * Combines multiple boxes side-by-side, using alignment to handle boxes
 * of different heights. The resulting box width equals the sum of all
 * input box widths.
 *
 * **Mathematical Properties**
 * - **Associative**: `hcat(a, [hcat(a, [x, y]), z]) ≡ hcat(a, [x, hcat(a, [y, z])])`
 * - **Identity**: `hcat(a, [nullBox, x]) ≡ hcat(a, [x, nullBox]) ≡ x`
 *
 * **Example** (Basic concatenation)
 *
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const left = Box.text("Left")
 * const right = Box.text("Right")
 * const combined = Box.hcat([left, right], Box.top)
 * console.log(Box.render(combined))
 * // LeftRight
 * ```
 *
 * **Example** (Alignment with different heights)
 *
 * ```typescript
 * const tall = Box.text("A\nB\nC")
 * const short = Box.text("X")
 * 
 * // Top alignment
 * const topAligned = Box.hcat([tall, short], Box.top)
 * console.log(Box.render(topAligned))
 * // AX
 * // B
 * // C
 * 
 * // Center alignment
 * const centered = Box.hcat([tall, short], Box.center1)
 * console.log(Box.render(centered))
 * // A
 * // BX
 * // C
 * ```
 *
 * **Example** (Complex layout composition)
 *
 * ```typescript
 * import { pipe } from "effect"
 * import * as Box from "effect-boxes/Box"
 *
 * const header = Box.text("HEADER").pipe(
 *   Box.alignHoriz(Box.center1, 20)
 * )
 * 
 * const content = pipe(
 *   [Box.text("Left Column"), Box.text("Right Column")],
 *   boxes => Box.hcat(boxes, Box.top),
 *   Box.alignHoriz(Box.center1, 20)
 * )
 *
 * const layout = Box.vcat([header, content], Box.left)
 * ```
 *
 * @note Haskell: `hcat :: Foldable f => Alignment -> f Box -> Box`
 * @category combinators
 */
```

### Cross-Module Integration Example
```typescript
/**
 * Renders box content with ANSI color codes.
 *
 * **Example** (Box with Annotation and ANSI)
 *
 * ```typescript
 * import { pipe } from "effect"
 * import * as Box from "effect-boxes/Box"
 * import * as Annotation from "effect-boxes/Annotation"
 * import * as Ansi from "effect-boxes/Ansi"
 *
 * const coloredBox = pipe(
 *   Box.text("Important Message"),
 *   Box.annotate(Annotation.color(Ansi.red)),
 *   Box.alignHoriz(Box.center1, 30)
 * )
 *
 * console.log(Ansi.render(coloredBox))
 * // Outputs red text centered in 30-character width
 * ```
 *
 * @category utilities
 */
```

## 🚨 Common Pitfalls to Avoid

### Documentation Anti-Patterns

```typescript
// ❌ WRONG - Vague descriptions
/**
 * Does box stuff.
 */

// ❌ WRONG - Removing existing Haskell references
/**
 * Creates boxes horizontally.
 * // Missing: @note Haskell: `hcat :: Foldable f => Alignment -> f Box -> Box`
 */

// ❌ WRONG - Non-compiling examples
/**
 * @example
 * ```typescript
 * const box = Box.magic(undefined) // This won't compile!
 * ```
 */

// ❌ WRONG - Missing categories
/**
 * Important public function with no categorization.
 */

// ❌ WRONG - Overly complex mathematical explanations
/**
 * Implements a covariant endofunctor in the category of boxes
 * with natural transformations preserving the compositional
 * structure of the underlying algebraic lattice...
 * // Too abstract - make it practical!
 */
```

### Correct Patterns

```typescript
// ✅ CORRECT - Clear, complete documentation with math context
/**
 * Creates a box containing the specified text content.
 *
 * **Example**
 *
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 *
 * const simple = Box.text("Hello")
 * console.log(Box.render(simple))
 * // Hello
 * ```
 *
 * @note Haskell: `text :: String -> Box`
 * @category constructors
 */

// ✅ CORRECT - Mathematical properties for complex operations
/**
 * Combines two boxes using the semigroup operation.
 * 
 * Horizontally concatenates boxes with top alignment, forming the
 * fundamental combining operation for the Box semigroup.
 * 
 * **Mathematical Properties**
 * - **Associative**: `combine(combine(a, b), c) ≡ combine(a, combine(b, c))`
 * - **Identity**: When combined with `nullBox`, returns the original box
 * 
 * **Example**
 * 
 * ```typescript
 * import * as Box from "effect-boxes/Box"
 * 
 * const left = Box.text("Hello")
 * const right = Box.text("World")
 * const combined = Box.combine(left, right)
 * console.log(Box.render(combined))
 * // HelloWorld
 * ```
 *
 * @note Haskell: `(<>) :: Box -> Box -> Box`
 * @note Haskell: `instance Semigroup Box where l <> r = hcat top [l,r]`
 * @category combinators
 */
```

## 🔄 Migration Checklist

When updating existing documentation:

- [ ] **Preserve existing Haskell references** - keep all `@note Haskell:` patterns
- [ ] Add `@category` tag appropriate to function type
- [ ] Improve description clarity using action verbs and specific behavior
- [ ] Add at least one `@example` with compiling code
- [ ] Verify examples compile with `bun run type-check`
- [ ] Use correct import patterns in examples
- [ ] Include expected output in example comments
- [ ] For dual functions, show both data-first and data-last usage
- [ ] For complex functions, include pipe composition example
- [ ] Add mathematical properties when they help understanding
- [ ] Bridge mathematical concepts for broader accessibility

## 📚 Reference Implementation

See the updated documentation in:
- `/src/Box.ts` - Primary examples of all patterns
- `/src/Ansi.ts` - Cross-module integration examples  
- `/src/Annotation.ts` - Type-safe annotation examples

## 🔗 Additional Resources

- [Effect.js Documentation Patterns](https://github.com/Effect-TS/effect-smol/blob/main/.patterns/jsdoc-documentation.md)
- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [TSDoc Specification](https://tsdoc.org/)

---

**⚠️ Compliance Requirement**: All public functions MUST have `@category` tags and compiling examples. **Preserve all existing `@note Haskell:` references** - they provide valuable mathematical context. Use `bun run type-check` to validate example compilation.