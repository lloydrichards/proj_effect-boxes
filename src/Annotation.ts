import * as Equal from "effect/Equal";
import * as Hash from "effect/Hash";
import { type Pipeable, pipeArguments } from "effect/Pipeable";

const AnnotationBrand: unique symbol = Symbol.for("@effect/Box/Annotation");

/**
 * Generic annotation wrapper with branded type safety.
 */
export interface Annotation<A = never>
  extends Pipeable,
    Equal.Equal,
    Hash.Hash {
  readonly [AnnotationBrand]: "annotation";
  readonly data: A;
}

/**
 * Type guard to check if a value is an Annotation.
 * @param value - The value to check
 */
export const isAnnotation = (value: unknown): value is Annotation<unknown> =>
  typeof value === "object" &&
  value !== null &&
  "data" in value &&
  AnnotationBrand in value &&
  (value as Record<PropertyKey, unknown>)[AnnotationBrand] === "annotation";

/**
 * Type guard to check if a value is an Annotation with specific data type.
 * @param value - The value to check
 * @param dataGuard - Type guard function for the data type A
 */
export const isAnnotationWithData = <A>(
  value: unknown,
  dataGuard: (data: unknown) => data is A
): value is Annotation<A> => isAnnotation(value) && dataGuard(value.data);

/**
 * Creates a new Annotation<A> with the provided data.
 * @param data - The annotation data of type A
 */
export const createAnnotation = <A>(data: A): Annotation<A> => ({
  [AnnotationBrand]: "annotation" as const,
  [Equal.symbol](this: Annotation<A>, that: unknown): boolean {
    return isAnnotation(that) && Equal.equals(this.data, that.data);
  },
  [Hash.symbol](this: Annotation<A>): number {
    return Hash.hash(this.data);
  },
  pipe() {
    // biome-ignore lint/correctness/noUndeclaredVariables: typescript does not recognize that this is a method on Box
    return pipeArguments(this, arguments);
  },
  data,
});

/**
 * Extracts the data from an Annotation<A>.
 * @param annotation - The annotation to extract data from
 */
export const getAnnotationData = <A>(annotation: Annotation<A>): A =>
  annotation.data;

/**
 * Maps the data of an Annotation<A> to create an Annotation<B>.
 * @param annotation - The source annotation
 * @param mapper - Function to transform data from A to B
 */
export const mapAnnotationData = <A, B>(
  annotation: Annotation<A>,
  mapper: (data: A) => B
): Annotation<B> => createAnnotation(mapper(annotation.data));

/**
 * Combines two annotations by merging their data.
 * @param first - First annotation
 * @param second - Second annotation
 * @param merger - Function to merge data from both annotations
 */
export const combineAnnotations = <A>(
  first: Annotation<A>,
  second: Annotation<A>,
  merger: (a: A, b: A) => A
): Annotation<A> => createAnnotation(merger(first.data, second.data));

/**
 * Filters annotation data based on a predicate function.
 * @param annotation - The annotation to filter
 * @param predicate - Function to test the data
 */
export const filterAnnotation = <A>(
  annotation: Annotation<A>,
  predicate: (data: A) => boolean
): Annotation<A> | undefined =>
  predicate(annotation.data) ? annotation : undefined;

/**
 * Creates an array of annotations from an array of data.
 * @param dataArray - Array of data items to wrap in annotations
 */
export const createAnnotations = <A>(
  dataArray: readonly A[]
): Annotation<A>[] => dataArray.map(createAnnotation);

/**
 * Extracts data from an array of annotations.
 * @param annotations - Array of annotations to extract data from
 */
export const extractAnnotationData = <A>(
  annotations: readonly Annotation<A>[]
): A[] => annotations.map(getAnnotationData);

/**
 * Type-level utility to extract the data type from an Annotation type.
 */
export type AnnotationData<T> = T extends Annotation<infer A> ? A : never;

/**
 * Predefined empty annotation for use as a default or placeholder.
 */
export const empty: Annotation<never> = createAnnotation(undefined as never);

/**
 * Creates a copy of an annotation with the same data.
 * @param annotation - The annotation to clone
 */
export const cloneAnnotation = <A>(annotation: Annotation<A>): Annotation<A> =>
  createAnnotation(annotation.data);
