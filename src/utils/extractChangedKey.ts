/**
 * Represents an object with string keys and unknown values, or undefined
 */
type Dependency = Record<string, unknown> | undefined;

/**
 * Compares two dependency objects and returns the first key that has changed.
 * Handles both primitive values and arrays comparison.
 * 
 * @param deps - Tuple of previous and next dependency objects to compare
 * @returns The key that changed between the two objects, or null if no changes found
 * 
 * @example
 * const prev = { count: 1, items: [1, 2] };
 * const next = { count: 1, items: [1, 2, 3] };
 * extractChangedKey([prev, next]); // Returns 'items'
 */
export function extractChangedKey(
  deps: [Dependency, Dependency]
): string | null {
  const [prev, next] = deps;

  for (const key in next) {
    if (prev === undefined) {
      return key;
    }

    if (Array.isArray(prev[key]) && Array.isArray(next[key])) {
      if (prev[key].length !== next[key].length) {
        return key;
      }

      if (!Object.is(prev[key], next[key])) {
        return key;
      }
    }

    if (prev[key] !== next[key]) {
      return key;
    }
  }

  return null;
}
