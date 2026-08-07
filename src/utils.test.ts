// @vitest-environment node

import { describe, expect, it } from "vitest";

import type { DataGridState } from "./store/store.ts";
import { cloneDataGridState, isFilterEqual, isSelectedEqual } from "./utils.ts";

function state(overrides: Partial<DataGridState> = {}): DataGridState {
  return {
    page: 1,
    limit: 10,
    sort: null,
    order: null,
    filter: {},
    selected: [],
    ...overrides,
  };
}

describe("cloneDataGridState", () => {
  it("works without a DOM, which is what makes the package usable during SSR", () => {
    expect(typeof globalThis.window).toBe("undefined");
    expect(() => cloneDataGridState(state())).not.toThrow();
  });

  it("does not throw on filter values that structuredClone would reject", () => {
    const source = state({ filter: { predicate: () => true, node: Symbol("node") } });

    expect(() => cloneDataGridState(source)).not.toThrow();
    expect(cloneDataGridState(source).filter.predicate).toBe(source.filter.predicate);
  });

  it("isolates the assignments and deletions a deriveState actually performs", () => {
    const source = state({ filter: { currency: "USD", method: 1 } });
    const clone = cloneDataGridState(source);

    clone.filter.method = undefined;
    delete clone.filter.currency;
    clone.page = 5;

    expect(source.filter).toEqual({ currency: "USD", method: 1 });
    expect(source.page).toBe(1);
  });

  it("isolates the selection array", () => {
    const source = state({ selected: ["a", "b"] });
    const clone = cloneDataGridState(source);

    clone.selected.push("c");

    expect(source.selected).toEqual(["a", "b"]);
  });

  it("normalizes a missing selection or filter to an empty one", () => {
    const clone = cloneDataGridState(state({ selected: undefined as never, filter: undefined as never }));

    expect(clone.selected).toEqual([]);
    expect(clone.filter).toEqual({});
  });
});

describe("isFilterEqual", () => {
  it("treats an explicit undefined entry as different from a missing one", () => {
    expect(isFilterEqual({ method: undefined }, {})).toBe(false);
    expect(isFilterEqual({}, { method: undefined })).toBe(false);
  });

  it("ignores key order", () => {
    expect(isFilterEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it("compares array values element by element rather than by reference", () => {
    expect(isFilterEqual({ status: ["a", "b"] }, { status: ["a", "b"] })).toBe(true);
    expect(isFilterEqual({ status: ["a", "b"] }, { status: ["b", "a"] })).toBe(false);
    expect(isFilterEqual({ status: ["a"] }, { status: ["a", "b"] })).toBe(false);
    expect(isFilterEqual({ status: ["a"] }, { status: "a" })).toBe(false);
  });

  it("reports differing sizes and values", () => {
    expect(isFilterEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(isFilterEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(isFilterEqual({ a: 1 }, { b: 1 })).toBe(false);
  });

  it("is true for equal objects and for the same reference", () => {
    const shared = { a: 1 };

    expect(isFilterEqual(shared, shared)).toBe(true);
    expect(isFilterEqual({}, {})).toBe(true);
  });
});

describe("isSelectedEqual", () => {
  it("compares by value and treats order as significant", () => {
    expect(isSelectedEqual(["a", "b"], ["a", "b"])).toBe(true);
    expect(isSelectedEqual(["a", "b"], ["b", "a"])).toBe(false);
    expect(isSelectedEqual(["a"], ["a", "b"])).toBe(false);
    expect(isSelectedEqual([], [])).toBe(true);
  });

  it("short-circuits on identity", () => {
    const shared = ["a"];

    expect(isSelectedEqual(shared, shared)).toBe(true);
  });

  it("treats a missing array as different from an empty one", () => {
    expect(isSelectedEqual(undefined, [])).toBe(false);
    expect(isSelectedEqual([], null)).toBe(false);
    expect(isSelectedEqual(null, null)).toBe(true);
  });
});

describe("isFilterEqual, nullish inputs", () => {
  it("treats a missing object as different from an empty one", () => {
    expect(isFilterEqual(undefined, {})).toBe(false);
    expect(isFilterEqual({}, null)).toBe(false);
    expect(isFilterEqual(null, null)).toBe(true);
  });
});
