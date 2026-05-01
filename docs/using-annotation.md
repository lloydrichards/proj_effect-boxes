# Annotation Module

The Annotation module provides a system for attaching metadata to boxes. This
enables features like ANSI styling, interactive elements, and custom data
associations.

## Core Concepts

An `Annotation<A>` is a wrapper around arbitrary data of type `A`. Annotations
can be attached to boxes using the `Box.annotate` function, and they can
influence rendering behavior or store application-specific data.

## Basic Usage

### Creating Annotations

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import * as Annotation from "effect-boxes/Annotation";

// Create a simple annotation with string data
const myAnnotation = Annotation.createAnnotation("metadata");

// Create an annotation with complex data
interface UserData {
  id: number;
  name: string;
}

const userData: UserData = { id: 123, name: "Alice" };
const userAnnotation = Annotation.createAnnotation(userData);
```

### Attaching Annotations to Boxes

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import * as Annotation from "effect-boxes/Annotation";

const myAnnotation = Annotation.createAnnotation("metadata");

// Attach an annotation to a box
const annotatedBox = Box.annotate(Box.text("Hello"), myAnnotation);

// Attach an annotation with pipe
const annotatedBox2 = pipe(Box.text("Hello"), Box.annotate(myAnnotation));
```

### Working with Annotated Boxes

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import * as Annotation from "effect-boxes/Annotation";

const myAnnotation = Annotation.createAnnotation("metadata");
const annotatedBox = Box.annotate(Box.text("Hello"), myAnnotation);

// Remove annotation from a box
const plainBox = Box.unAnnotate(annotatedBox);

// Transform the annotation data
const updatedBox = Box.reAnnotate(annotatedBox, (data: string) =>
  data.toUpperCase()
);

// Create multiple boxes with different annotations
const boxes = Box.alterAnnotation(annotatedBox, (data: string) => [
  data + "1",
  data + "2",
  data + "3",
]);
// Result: Array of 3 boxes with annotations "metadata1", "metadata2", "metadata3"
```

## Annotation Utilities

### Type Guards

```typescript
import * as Annotation from "effect-boxes/Annotation";

// Check if a value is an Annotation
const isAnnotation = Annotation.isAnnotation(value);

// Check if a value is an Annotation with specific data type
const isUserAnnotation = Annotation.isAnnotationWithData(
  value,
  (data): data is UserData =>
    typeof data === "object" && data !== null && "id" in data && "name" in data
);
```

### Data Extraction and Manipulation

```typescript
import * as Annotation from "effect-boxes/Annotation";

const myAnnotation = Annotation.createAnnotation("metadata");

// Extract data from an annotation

// Map annotation data to create a new annotation
const uppercaseAnnotation = Annotation.mapAnnotationData(
  myAnnotation,
  (data: string) => data.toUpperCase()
);

// Combine two annotations
const combinedAnnotation = Annotation.combineAnnotations(
  Annotation.createAnnotation({ count: 5 }),
  Annotation.createAnnotation({ count: 10 }),
  (a, b) => ({ count: a.count + b.count })
);
// Result: Annotation with data { count: 15 }

// Filter annotation based on a predicate
const filteredAnnotation = Annotation.filterAnnotation(
  Annotation.createAnnotation(42),
  (num) => num > 10
);
// Result: Original annotation (condition is true)
```

### Batch Operations

```typescript
import * as Annotation from "effect-boxes/Annotation";

// Create multiple annotations from data array
const dataArray = ["one", "two", "three"];
const annotations = Annotation.createAnnotations(dataArray);

// Extract data from multiple annotations
const extractedData = Annotation.extractAnnotationData(annotations);
// Result: ["one", "two", "three"]
```

## Common Use Cases

### Custom Metadata

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import * as Annotation from "effect-boxes/Annotation";

// Attach application-specific data to UI elements
interface ButtonData {
  id: string;
  action: string;
  enabled: boolean;
}

const buttonAnnotation = Annotation.createAnnotation<ButtonData>({
  id: "submit-btn",
  action: "submit-form",
  enabled: true,
});

const buttonBox = pipe(Box.text(" Submit "), Box.annotate(buttonAnnotation));
```

### Styling with ANSI

The ANSI module uses annotations to apply terminal styling:

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import * as Ansi from "effect-boxes/Ansi";

// The ANSI module creates specialized annotations
const coloredBox = pipe(Box.text("Error!"), Box.annotate(Ansi.red));

// Combine multiple styles
const styledBox = pipe(
  Box.text("Important"),
  Box.annotate(Ansi.combine(Ansi.bold, Ansi.underlined, Ansi.red))
);
```

## Advanced Usage

### Type-Level Utilities

```typescript
import * as Annotation from "effect-boxes/Annotation";

// Extract the data type from an Annotation type
import { type AnnotationData } from "effect-boxes/Annotation";

interface UserData {
  id: number;
  name: string;
}

type MyAnnotation = Annotation.Annotation<UserData>;
type ExtractedType = AnnotationData<MyAnnotation>;
// ExtractedType is equivalent to UserData
```

### Nested Annotations

When boxes with annotations are nested, the innermost annotation takes
precedence during rendering:

```typescript
import { pipe } from "effect";
import * as Box from "effect-boxes/Box";
import * as Ansi from "effect-boxes/Ansi";

const nestedBox = pipe(
  Box.text("Outer").pipe(Box.annotate(Ansi.red)),
  Box.hAppend(Box.text("Inner").pipe(Box.annotate(Ansi.blue)))
);
// "Outer" will be red, "Inner" will be blue
```

## See Also

- [Box Module](./using-box.md) - Core box creation and composition
- [ANSI Module](./using-ansi.md) - Terminal styling with ANSI codes (uses annotations)
- [Common Patterns](./common-patterns.md) - Reusable patterns and Effect.js
  integration
