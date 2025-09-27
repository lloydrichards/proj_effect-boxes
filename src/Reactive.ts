import type { HashMap, Option } from "effect";
import type { Annotation } from "./Annotation";
import type { AnsiStyle } from "./Ansi";
import type { Box } from "./Box";
import * as internal from "./internal/reactive";

/*
 *  --------------------------------------------------------------------------------
 *  --  Reactive Types  ------------------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Reactive identifier type for tracking box positions.
 */
export type Reactive = {
  readonly _tag: "ReactiveId";
  readonly id: string;
};
export type ReactiveAnnotation = Annotation<Reactive>;

/**
 * Map of reactive IDs to their positions in the rendered output.
 */
export type PositionMap = HashMap.HashMap<
  string, // Reactive ID
  {
    readonly row: number; // 0-based row position
    readonly col: number; // 0-based column position
    readonly rows: number; // height of the box
    readonly cols: number; // width of the box
  }
>;

/*
 *  --------------------------------------------------------------------------------
 *  --  Type Guards and Constructors  ----------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Type guard to check if a value is a Reactive annotation.
 * @param value - The value to check
 */
export const isReactive: (value: unknown) => value is Reactive =
  internal.isReactive;

/**
 * Creates a ReactiveId with the specified string identifier.
 * @param id - The string identifier for the reactive element
 */
export const make: (id: string) => Reactive = internal.make;

/**
 * Creates a reactive annotation with the specified string identifier.
 * @param id - The string identifier for the reactive element
 */
export const reactive: (id: string) => Annotation<Reactive> = internal.reactive;

/*
 *  --------------------------------------------------------------------------------
 *  --  Box Annotation Functions  --------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Annotates a box with a reactive identifier for position tracking.
 * Supports dual signatures:
 * - reactiveBox(box, id): Box<ReactiveId>
 * - reactiveBox(id)(box): Box<ReactiveId>
 *
 * @param self - The box to make reactive
 * @param id - The string identifier for tracking this box's position
 */
export const makeReactive: {
  (id: string): <A>(self: Box<A>) => Box<Reactive>;
  <A>(self: Box<A>, id: string): Box<Reactive>;
} = internal.makeReactive;

/*
 *  --------------------------------------------------------------------------------
 *  --  Position Tracking Render Functions  ----------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Collects positions of reactive annotations from a box.
 * @param self - The box to analyze for position tracking
 * @returns The position map containing reactive element positions
 */
export const getPositions: <A>(self: Box<A>) => PositionMap =
  internal.getPositions;

/*
 *  --------------------------------------------------------------------------------
 *  --  Cursor Navigation Commands  ------------------------------------------------
 *  --------------------------------------------------------------------------------
 */

/**
 * Creates a cursor movement command to navigate to a reactive box position.
 * @param positionMap - Map of reactive IDs to their positions
 * @param key - The reactive ID to move the cursor to
 * @returns Option containing cursor movement command, or None if ID not found
 */
export const cursorToReactive: {
  (key: string): (positionMap: PositionMap) => Option.Option<Box<AnsiStyle>>;
  (positionMap: PositionMap, key: string): Option.Option<Box<AnsiStyle>>;
} = internal.cursorToReactive;
