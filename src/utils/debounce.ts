/** A global map to store active debounce timers, keyed by a unique identifier. This allows multiple independent debounces to coexist. */
const DEBOUNCE_HASH_MAP = new Map<string, NodeJS.Timeout>();

/**
 * Debounces a function call. This is useful for delaying expensive operations, such as API calls
 * from a filter input, until the user has stopped typing for a specified period.
 *
 * @param {string} key - A unique string to identify this specific debounce instance (e.g., a column key).
 * @param {() => void} callback - The function to execute after the delay has passed without further calls.
 * @param {number} delay - The debounce delay in milliseconds.
 */
export function debounce(key: string, callback: () => void, delay: number): void {
  // If a timer already exists for this key, clear it to reset the delay.
  if (DEBOUNCE_HASH_MAP.has(key)) {
    clearTimeout(DEBOUNCE_HASH_MAP.get(key)!);
  }

  // Set a new timer. When it completes, it executes the callback and cleans up the map.
  const timeout = setTimeout(() => {
    callback();
    DEBOUNCE_HASH_MAP.delete(key);
  }, delay);

  DEBOUNCE_HASH_MAP.set(key, timeout);
}
