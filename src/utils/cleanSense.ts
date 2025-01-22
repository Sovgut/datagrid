/**
 * Utility class for cleaning data structures by removing empty, null, or undefined values
 */
export class CleanSense {
  /**
   * Removes empty arrays from the provided object
   * @param reference - Object to clean
   * 
   * @example
   * CleanSense.array({ items: [], valid: [1, 2] })
   * // Result: { valid: [1, 2] }
   */
  public static array(reference: Record<string, unknown>): void {
    Object.entries(reference).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length === 0) {
        delete reference![key];
      }
    });
  }
  
  /**
   * Removes empty strings from the object and filters out empty strings from arrays
   * @param reference - Object to clean
   * 
   * @example
   * CleanSense.string({ name: "", tags: ["", "valid"] })
   * // Result: { tags: ["valid"] }
   */
  public static string(reference: Record<string, unknown>): void {
    Object.entries(reference).forEach(([key, value]) => {
      if (value === "") {
        delete reference![key];
      }

      if (Array.isArray(value) && (value as Array<string>).includes("")) {
        reference![key] = value.filter((v) => v !== "");
      }
    });
  }
  
  /**
   * Removes null values from the object and filters out null values from arrays
   * @param reference - Object to clean
   * 
   * @example
   * CleanSense.null({ id: null, items: [null, "valid"] })
   * // Result: { items: ["valid"] }
   */
  public static null(reference: Record<string, unknown>): void {
    Object.entries(reference).forEach(([key, value]) => {
      if (value === null) {
        delete reference![key];
      }

      if (
        Array.isArray(value) &&
        (value as Array<string | null>).includes(null)
      ) {
        reference![key] = value.filter((v) => v !== null);
      }
    });
  }
  
  /**
   * Removes undefined values from the object and filters out undefined values from arrays
   * @param reference - Object to clean
   * 
   * @example
   * CleanSense.undefined({ id: undefined, items: [undefined, "valid"] })
   * // Result: { items: ["valid"] }
   */
  public static undefined(reference: Record<string, unknown>): void {
    Object.entries(reference).forEach(([key, value]) => {
      if (value === undefined) {
        delete reference![key];
      }

      if (
        Array.isArray(value) &&
        (value as Array<string | undefined>).includes(undefined)
      ) {
        reference![key] = value.filter((v) => v !== undefined);
      }
    });
  }
}
