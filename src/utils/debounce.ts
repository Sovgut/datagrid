/**
 * Storage for timeout identifiers, keyed by unique string identifiers
 */
const DEBOUNCE_HASH_MAP = new Map<string, number>();

/**
 * Debounces a callback function, ensuring it only executes after a specified delay
 * since its last invocation. Multiple calls with the same key will reset the delay.
 * 
 * @param key - Unique identifier for this debounce instance
 * @param callback - Function to be executed after the delay
 * @param delay - Time in milliseconds to wait before executing the callback
 * 
 * @example
 * ```typescript
 * debounce('searchInput', () => {
 *   performSearch();
 * }, 300);
 * ```
 */
export function debounce(key: string, callback: () => void, delay: number) {
  if (DEBOUNCE_HASH_MAP.has(key)) {
    clearTimeout(DEBOUNCE_HASH_MAP.get(key));
  }

  const timeout = setTimeout(() => {
    callback();
    DEBOUNCE_HASH_MAP.delete(key);
  }, delay);

  DEBOUNCE_HASH_MAP.set(key, timeout);
}