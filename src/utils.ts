import type { DataGridState } from "./store/store.ts";
import type { ExpectedAny, Nullable } from "./types.ts";

/**
 * A grid state as it arrives from outside the package.
 *
 * `setState` is part of the public `DataGridReducer`, so its argument comes
 * from consumer code and from consumer-supplied stores, neither of which the
 * type system actually polices. This type says so out loud instead of letting
 * the runtime guards look redundant.
 */
type UntrustedDataGridState = Omit<DataGridState, "filter" | "selected"> & {
  filter: Nullable<DataGridState["filter"]>;
  selected: Nullable<DataGridState["selected"]>;
};

/**
 * Produces a copy of a grid state that a `deriveState` function may mutate
 * freely without touching the state held by the store.
 *
 * The copy is deliberately layered rather than deep. Three levels are fresh:
 * the state object itself, its `filter` object and its `selected` array. That
 * is exactly the depth a `deriveState` implementation can reach when it does
 * the things this API is designed for, namely assigning, reading and deleting
 * filter entries:
 *
 * ```ts
 * deriveState: (ctx) => {
 *   ctx.filter.method = undefined;   // safe, `filter` is a fresh object
 *   delete ctx.filter.currency;      // safe
 *   return ctx;
 * }
 * ```
 *
 * Values nested inside a filter entry are shared with the original by
 * reference. Mutating one of them reaches back into the store, so treat filter
 * values as immutable and replace them instead of editing them in place.
 *
 * A deep clone was deliberately rejected here. `structuredClone` throws on
 * functions and React elements, both of which a consumer may legitimately park
 * in a filter value, and it is unavailable without a DOM in some runtimes; the
 * `JSON.parse(JSON.stringify(...))` fallback silently drops `undefined` and
 * flattens `Date`, `Map` and `Set`. This function touches neither, so it works
 * unchanged during server-side rendering.
 *
 * A missing `filter` or `selected` is normalized to an empty one rather than
 * propagated, so the returned state always satisfies {@link DataGridState}.
 */
export function cloneDataGridState(state: UntrustedDataGridState): DataGridState {
  return {
    ...state,
    filter: state.filter ? { ...state.filter } : {},
    selected: state.selected ? [...state.selected] : [],
  };
}

/**
 * Compares two selection arrays by value.
 *
 * Order is significant: two arrays holding the same ids in a different order
 * are reported as different, because the order is the consumer's to define and
 * the grid must not silently discard a reordering.
 */
export function isSelectedEqual(a: Nullable<string[]>, b: Nullable<string[]>): boolean {
  if (a === b) {
    return true;
  }

  if (!a || !b || a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index++) {
    if (!Object.is(a[index], b[index])) {
      return false;
    }
  }

  return true;
}

/**
 * Compares two filter objects by value, one level deep, with array values
 * compared element by element.
 *
 * This intentionally replaces a `JSON.stringify` comparison, which was wrong in
 * two directions: it reported `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` as
 * different because key order leaks into the serialized form, and it reported
 * `{ a: undefined }` and `{}` as equal because `JSON.stringify` drops
 * `undefined` entries. The second case is not academic: a `deriveState` that
 * invalidates a dependent filter usually does so by assigning `undefined`, and
 * that change has to reach the store.
 *
 * The comparison assumes a filter value is a primitive or an array of
 * primitives, which is the contract the grid documents and the shape a filter
 * has to have to survive a round trip through a URL query string. Values of
 * any other type are compared by reference.
 */
export function isFilterEqual(
  a: Nullable<Record<string, ExpectedAny>>,
  b: Nullable<Record<string, ExpectedAny>>
): boolean {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  const keys = Object.keys(a);

  if (keys.length !== Object.keys(b).length) {
    return false;
  }

  for (const key of keys) {
    if (!Object.hasOwn(b, key)) {
      return false;
    }

    const left = a[key];
    const right = b[key];

    if (Array.isArray(left) || Array.isArray(right)) {
      if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
        return false;
      }

      for (let index = 0; index < left.length; index++) {
        if (!Object.is(left[index], right[index])) {
          return false;
        }
      }

      continue;
    }

    if (!Object.is(left, right)) {
      return false;
    }
  }

  return true;
}
