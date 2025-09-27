import type * as Equal from "effect/Equal";
import type * as Hash from "effect/Hash";
import type { Pipeable } from "effect/Pipeable";
import * as internal from "./internal/annotation";

export const AnnotationTypeId: unique symbol = internal.AnnotationTypeId;

/**
 *
 */
export type AnnotationTypeId = typeof AnnotationTypeId;

/**
 * Generic annotation wrapper with branded type safety.
 */
export interface Annotation<A = never>
  extends Pipeable,
    Equal.Equal,
    Hash.Hash {
  readonly [AnnotationTypeId]: "annotation";
  readonly data: A;
}

/**
 * Type guard to check if a value is an Annotation.
 * @param value - The value to check
 */
export const isAnnotation: (value: unknown) => value is Annotation<unknown> =
  internal.isAnnotation;

/**
 * Type guard to check if a value is an Annotation with specific data type.
 * @param value - The value to check
 * @param dataGuard - Type guard function for the data type A
 */
export const isAnnotationWithData: <A>(
  value: unknown,
  dataGuard: (data: unknown) => data is A
) => value is Annotation<A> = internal.isAnnotationWithData;

/**
 * Creates a new Annotation<A> with the provided data.
 * @param data - The annotation data of type A
 */
export const createAnnotation: <A>(data: A) => Annotation<A> =
  internal.createAnnotation;

/**
 * Extracts the data from an Annotation<A>.
 * @param annotation - The annotation to extract data from
 */
export const getAnnotationData: <A>(annotation: Annotation<A>) => A =
  internal.getAnnotationData;

/**
 * Maps the data of an Annotation<A> to create an Annotation<B>.
 * @param annotation - The source annotation
 * @param mapper - Function to transform data from A to B
 */
export const mapAnnotationData: <A, B>(
  annotation: Annotation<A>,
  mapper: (data: A) => B
) => Annotation<B> = internal.mapAnnotationData;
/**
 * Combines two annotations by merging their data.
 * @param first - First annotation
 * @param second - Second annotation
 * @param merger - Function to merge data from both annotations
 */
export const combineAnnotations: <A>(
  first: Annotation<A>,
  second: Annotation<A>,
  merger: (a: A, b: A) => A
) => Annotation<A> = internal.combineAnnotations;

/**
 * Filters annotation data based on a predicate function.
 * @param annotation - The annotation to filter
 * @param predicate - Function to test the data
 */
export const filterAnnotation: <A>(
  annotation: Annotation<A>,
  predicate: (data: A) => boolean
) => Annotation<A> | undefined = internal.filterAnnotation;

/**
 * Creates an array of annotations from an array of data.
 * @param dataArray - Array of data items to wrap in annotations
 */
export const createAnnotations: <A>(
  dataArray: readonly A[]
) => Annotation<A>[] = internal.createAnnotations;

/**
 * Extracts data from an array of annotations.
 * @param annotations - Array of annotations to extract data from
 */
export const extractAnnotationData: <A>(
  annotations: readonly Annotation<A>[]
) => A[] = internal.extractAnnotationData;

/**
 * Type-level utility to extract the data type from an Annotation type.
 */
export type AnnotationData<T> = T extends Annotation<infer A> ? A : never;

/**
 * Predefined empty annotation for use as a default or placeholder.
 */
export const empty: Annotation<never> = internal.empty;

/**
 * Creates a copy of an annotation with the same data.
 * @param annotation - The annotation to clone
 */
export const cloneAnnotation: <A>(annotation: Annotation<A>) => Annotation<A> =
  internal.cloneAnnotation;
