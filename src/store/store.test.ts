// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  DATAGRID_DEFAULT_FILTER,
  DATAGRID_DEFAULT_LIMIT,
  DATAGRID_DEFAULT_ORDER,
  DATAGRID_DEFAULT_PAGE,
  DATAGRID_DEFAULT_SELECTED,
  DATAGRID_DEFAULT_SORT,
} from "../constants.ts";
import { createDataGridStore, type DataGridState } from "./store.ts";

describe("createDataGridStore", () => {
  it("starts from the package defaults when given no initial state", () => {
    const store = createDataGridStore(null);

    expect(store.getState()).toMatchObject({
      page: DATAGRID_DEFAULT_PAGE,
      limit: DATAGRID_DEFAULT_LIMIT,
      sort: DATAGRID_DEFAULT_SORT,
      order: DATAGRID_DEFAULT_ORDER,
      filter: DATAGRID_DEFAULT_FILTER,
      selected: DATAGRID_DEFAULT_SELECTED,
    });
  });

  it("lets initial state override some fields while the rest keep their defaults", () => {
    const store = createDataGridStore({ limit: 25, sort: "name" });
    const state = store.getState();

    expect(state.limit).toBe(25);
    expect(state.sort).toBe("name");
    expect(state.page).toBe(DATAGRID_DEFAULT_PAGE);
    expect(state.order).toBe(DATAGRID_DEFAULT_ORDER);
  });

  it("ignores explicit undefined in the initial state instead of writing it", () => {
    // Built key by key rather than as a literal: `exactOptionalPropertyTypes`
    // rejects writing an explicit `undefined`, but no consumer compiles with
    // that flag, so this is what actually reaches the store in practice.
    const query: Partial<DataGridState> = { limit: 25 };
    Reflect.set(query, "sort", undefined);
    Reflect.set(query, "page", undefined);

    const store = createDataGridStore(query);
    const state = store.getState();

    expect(state.sort).toBe(DATAGRID_DEFAULT_SORT);
    expect(state.page).toBe(DATAGRID_DEFAULT_PAGE);
    expect(state.limit).toBe(25);
  });

  it("keeps every grid instance on its own state", () => {
    const first = createDataGridStore(null);
    const second = createDataGridStore(null);

    first.getState().setFilter({ status: "active" });

    expect(second.getState().filter).toEqual({});
  });

  it("setPagination touches page and limit only", () => {
    const store = createDataGridStore({ sort: "name", order: "asc" });

    store.getState().setPagination(3, 50);
    const state = store.getState();

    expect(state.page).toBe(3);
    expect(state.limit).toBe(50);
    expect(state.sort).toBe("name");
    expect(state.order).toBe("asc");
  });

  it("setSorting normalizes null and undefined back to the defaults", () => {
    const store = createDataGridStore({ sort: "name", order: "asc" });

    store.getState().setSorting(null, null);
    expect(store.getState()).toMatchObject({ sort: DATAGRID_DEFAULT_SORT, order: DATAGRID_DEFAULT_ORDER });

    store.getState().setSorting("name", "desc");
    store.getState().setSorting(undefined as never, undefined as never);
    expect(store.getState()).toMatchObject({ sort: DATAGRID_DEFAULT_SORT, order: DATAGRID_DEFAULT_ORDER });
  });

  it("setFilter replaces the filter wholesale", () => {
    const store = createDataGridStore({ filter: { a: 1 } });

    store.getState().setFilter({ b: 2 });

    expect(store.getState().filter).toEqual({ b: 2 });
  });

  it("setSelected replaces the selection wholesale", () => {
    const store = createDataGridStore({ selected: ["a"] });

    store.getState().setSelected(["b", "c"]);

    expect(store.getState().selected).toEqual(["b", "c"]);
  });

  it("setState merges over the previous state instead of replacing it", () => {
    const store = createDataGridStore({ limit: 25 });

    store.getState().setState({ page: 4 } as never);
    const state = store.getState();

    expect(state.page).toBe(4);
    expect(state.limit).toBe(25);
    expect(typeof state.setPagination).toBe("function");
  });
});
