type Dependency = Record<string, unknown> | undefined;

/**
 * Compares two dependency objects (`previous` and `next`) and returns the key of the first property that has changed.
 * This is primarily used to identify which specific filter was updated in order to apply column-specific logic, such as debouncing.
 * It handles changes in both primitive values and array lengths/references.
 *
 * @param {[Dependency, Dependency]} deps - A tuple containing the `[previous, next]` objects to compare.
 * @returns {string | null} The key of the first changed property, or `null` if no changes are detected.
 */
export function extractChangedKey(
  deps: [Dependency, Dependency]
): string | null {
  const [prev, next] = deps;

  if (!next) return null;

  for (const key in next) {
    // If the previous state didn't exist, any key in the next state is a change.
    if (prev === undefined) {
      return key;
    }

    const prevValue = prev[key];
    const nextValue = next[key];

    // Handle array comparison. A change is detected if length or reference differs.
    if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
      if (prevValue.length !== nextValue.length || !Object.is(prevValue, nextValue)) {
        return key;
      }
    } else if (prevValue !== nextValue) {
      // Handle primitive value comparison.
      return key;
    }
  }

  return null;
}
