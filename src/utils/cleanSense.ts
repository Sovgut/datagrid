/**
 * A utility class with static methods to clean data objects by removing various unwanted values.
 * ❗ **Important:** These methods mutate the provided object reference directly.
 */
export class CleanSense {
  /**
   * Removes properties from an object whose values are empty arrays.
   * @param {Record<string, unknown>} reference - The object to clean in place.
   */
  public static array(reference: Record<string, unknown>): void {
    Object.keys(reference).forEach((key) => {
      const value = reference[key];
      if (Array.isArray(value) && value.length === 0) {
        delete reference[key];
      }
    });
  }

  /**
   * Removes properties with empty string values, and filters empty strings from array values.
   * @param {Record<string, unknown>} reference - The object to clean in place.
   */
  public static string(reference: Record<string, unknown>): void {
    Object.keys(reference).forEach((key) => {
      const value = reference[key];
      if (value === "") {
        delete reference[key];
      }
      if (Array.isArray(value)) {
        const filtered = value.filter((v) => v !== "");
        if (filtered.length !== value.length) {
          reference[key] = filtered;
        }
      }
    });
  }

  /**
   * Removes properties with `null` values, and filters `null` from array values.
   * @param {Record<string, unknown>} reference - The object to clean in place.
   */
  public static null(reference: Record<string, unknown>): void {
    Object.keys(reference).forEach((key) => {
      const value = reference[key];
      if (value === null) {
        delete reference[key];
      }
      if (Array.isArray(value)) {
        const filtered = value.filter((v) => v !== null);
        if (filtered.length !== value.length) {
          reference[key] = filtered;
        }
      }
    });
  }

  /**
   * Removes properties with `undefined` values, and filters `undefined` from array values.
   * @param {Record<string, unknown>} reference - The object to clean in place.
   */
  public static undefined(reference: Record<string, unknown>): void {
    Object.keys(reference).forEach((key) => {
      const value = reference[key];
      if (value === undefined) {
        delete reference[key];
      }
      if (Array.isArray(value)) {
        const filtered = value.filter((v) => v !== undefined);
        if (filtered.length !== value.length) {
          reference[key] = filtered;
        }
      }
    });
  }
}
