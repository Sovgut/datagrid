export function deepCopy<T>(obj: T): T {
  if (typeof window.structuredClone !== "undefined") {
    return window.structuredClone(obj) as T;
  }

  return JSON.parse(JSON.stringify(obj)) as T;
}
