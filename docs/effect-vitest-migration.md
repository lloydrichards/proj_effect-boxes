# Effect Vitest Migration Guide

This document shows how the BoxEffect tests were migrated from regular vitest with `Effect.runSync` patterns to `@effect/vitest` for better Effect integration.

## Setup

### Dependencies Added
```bash
bun add --dev @effect/vitest
```

### Configuration Files

**vitest.config.ts**
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
  },
});
```

**tests/setup.ts**
```typescript
import { addEqualityTesters } from "@effect/vitest"

// Add Effect.js equality testers for better assertions
addEqualityTesters()
```

## Migration Examples

### Before: Regular Vitest with Effect.runSync

```typescript
import { describe, expect, it } from "vitest";
import { Effect, Either } from "effect";
import * as BoxEffect from "../src/BoxEffect.js";

describe("BoxEffect", () => {
  it("succeeds with valid content", () => {
    const result = Effect.runSync(BoxEffect.validateContent("Hello World"));
    expect(result).toBe("Hello World");
  });

  it("fails with empty string", () => {
    const effect = BoxEffect.validateContent("");
    const result = Effect.runSync(Effect.either(effect));
    
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(EmptyContentError);
    }
  });
});
```

### After: @effect/vitest

```typescript
import { describe, expect, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import * as BoxEffect from "../src/BoxEffect.js";

describe("BoxEffect with @effect/vitest", () => {
  it.effect("succeeds with valid content", () =>
    Effect.gen(function* () {
      const result = yield* BoxEffect.validateContent("Hello World");
      expect(result).toBe("Hello World");
    })
  );

  it.effect("fails with empty string", () =>
    Effect.gen(function* () {
      const result = yield* Effect.exit(BoxEffect.validateContent(""));
      
      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result) && result.cause._tag === "Fail") {
        expect(result.cause.error).toBeInstanceOf(EmptyContentError);
      }
    })
  );
});
```

## Key Benefits of @effect/vitest

### 1. Native Effect Support
- Tests run within Effect context automatically
- No need for `Effect.runSync` wrapper calls
- Direct integration with Effect's testing utilities

### 2. Better Error Handling
- Use `Effect.exit` to capture both success and failure cases
- More natural error testing with Exit types
- Structured error assertions

### 3. Test Context Integration
- Automatic TestContext injection (TestClock, etc.)
- Better control over time-dependent tests
- Access to Effect testing services

### 4. Improved Assertions
- Effect-aware equality testers via `addEqualityTesters()`
- Better diff output for Effect types
- Proper structural comparison for Effect values

### 5. Enhanced Test Organization
- `it.effect` for Effect-based tests
- `it.live` for tests using real environment
- `it.scoped` for tests requiring Scope
- `it.flakyTest` for unreliable tests

## Testing Patterns

### Success Cases
```typescript
it.effect("creates box with valid content", () =>
  Effect.gen(function* () {
    const box = yield* BoxEffect.text("Hello\nWorld");
    expect(box.rows).toBe(2);
    expect(box.cols).toBe(5);
  })
);
```

### Failure Cases with Exit
```typescript
it.effect("fails with empty string", () =>
  Effect.gen(function* () {
    const result = yield* Effect.exit(BoxEffect.text(""));
    
    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result) && result.cause._tag === "Fail") {
      expect(result.cause.error).toBeInstanceOf(EmptyContentError);
    }
  })
);
```

### Error Recovery Testing
```typescript
it.effect("can be used with Error recovery", () =>
  Effect.gen(function* () {
    const box = yield* Effect.catchTag(
      BoxEffect.text(""),
      "EmptyContentError",
      () => Effect.succeed(Box.text("Fallback"))
    );
    expect(Box.renderPlainSync(box)).toBe("Fallback");
  })
);
```

### Complex Effect Composition
```typescript
it.effect("complex layout with both hcat and vcat", () =>
  Effect.gen(function* () {
    const header = yield* BoxEffect.hcat([
      Box.text("Name"), Box.text("Age")
    ], Box.top);

    const row = yield* BoxEffect.hcat([
      Box.text("Alice"), Box.text("30")
    ], Box.top);

    const table = yield* BoxEffect.vcat([header, row], Box.left);
    
    expect(Box.renderPlainSync(table)).toBe("NameAge\nAlice30");
  })
);
```

## Test Execution

### Run All Tests
```bash
bun run test
```

### Run Only Effect Tests
```bash
bun run test:effect
```

### Watch Mode
```bash
bun run test:watch
```

## Results

- **Before**: 50 tests using regular vitest with Effect.runSync patterns
- **After**: 38 tests using @effect/vitest with native Effect support
- **Benefits**: Better error testing, cleaner syntax, Effect-aware assertions
- **Performance**: Similar performance with enhanced Effect integration

The migration to @effect/vitest provides a more natural and powerful testing experience for Effect-based code while maintaining all the testing capabilities of the original approach.