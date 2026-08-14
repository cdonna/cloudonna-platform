import en from "./dictionaries/en";

/** Every locale's dictionary is typed against this — a missing or
 * mistyped key in de/fr/es.ts is a compile error, not a silently
 * blank string in production. */
export type Dictionary = typeof en;

export { en };
