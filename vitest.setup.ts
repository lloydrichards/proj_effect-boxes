/**
 * Setup file for @effect/vitest integration
 */

import { addEqualityTesters } from "@effect/vitest";

// Add Effect.js equality testers for better assertions
addEqualityTesters();
