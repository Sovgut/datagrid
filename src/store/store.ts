import { createStore, type StoreApi } from "zustand";

import {
  DATAGRID_DEFAULT_FILTER,
  DATAGRID_DEFAULT_LIMIT,
  DATAGRID_DEFAULT_ORDER,
  DATAGRID_DEFAULT_PAGE,
  DATAGRID_DEFAULT_SELECTED,
  DATAGRID_DEFAULT_SORT,
} from "../constants.ts";
import type { ExpectedAny, Nullable } from "../types.ts";

/**
 * Defines the core state structure of the DataGrid, including pagination,
 * sorting, filtering, and selection information.
 */
export interface DataGridState {
  /**
   * The current page number.
   * @default 1
   */
  page: number;

  /**
   * The number of items to display per page.
   * @default 10
   */
  limit: number;

  /**
   * The key of the column by which the data is sorted, or `null` when the data
   * is unsorted.
   *
   * `null` is the only way to say "unsorted". `setSorting` accepts `undefined`
   * for convenience and normalizes it, but the state itself never holds one:
   * two spellings of absence in a public type is a trap, not a convenience.
   *
   * @default null
   */
  sort: string | null;

  /**
   * The direction of the sort, or `null` when the data is unsorted.
   * @default null
   */
  order: "asc" | "desc" | null;

  /**
   * An object representing the active filters, where keys are column
   * identifiers and values are the filter values.
   * @default {}
   */
  filter: Record<string, ExpectedAny>;

  /**
   * An array of IDs corresponding to the currently selected rows.
   * @default []
   */
  selected: string[];
}

/**
 * Extends the DataGridState with action functions (reducers) to
 * update the state. This represents the complete public API of the store.
 */
export interface DataGridReducer extends DataGridState {
  /**
   * Sets the pagination state (current page and item limit).
   */
  setPagination: (page: DataGridState["page"], limit: DataGridState["limit"]) => void;

  /**
   * Sets the sorting state (sort key and order).
   *
   * `undefined` is accepted for either argument and normalized to `null`, so
   * `setSorting(column.key, undefined)` does not need a guard at the call site.
   */
  setSorting: (sort: Nullable<DataGridState["sort"]>, order: Nullable<DataGridState["order"]>) => void;

  /**
   * Sets the filter state.
   */
  setFilter: (filter: DataGridState["filter"]) => void;

  /**
   * Sets the selection state.
   */
  setSelected: (selected: DataGridState["selected"]) => void;

  /**
   * Replaces the entire query state in one call.
   *
   * The contract is a **complete** state, which is why the parameter is not
   * `Partial`. The built-in store still spreads what it receives over the
   * previous state, but that is a safety net for untyped callers rather than a
   * promise: an external store is free to replace outright, and
   * `@sovgut/datagrid-react-router` does exactly that. Do not rely on omitted
   * fields keeping their previous value.
   */
  setState: (state: DataGridState) => void;
}

/**
 * A factory function that creates a new Zustand store instance for managing
 * the DataGrid's state. It initializes with default values which can be
 * overridden by the provided initial properties.
 */
export const createDataGridStore = (initProps: Nullable<Partial<DataGridState>>): StoreApi<DataGridReducer> => {
  const defaults: DataGridState = {
    page: DATAGRID_DEFAULT_PAGE,
    limit: DATAGRID_DEFAULT_LIMIT,
    sort: DATAGRID_DEFAULT_SORT,
    order: DATAGRID_DEFAULT_ORDER,
    filter: DATAGRID_DEFAULT_FILTER,
    selected: DATAGRID_DEFAULT_SELECTED,
  };

  // Spreading `initProps` directly would let an explicit `undefined` overwrite
  // a default, so `query={{ sort: undefined }}` would put `undefined` into a
  // field the public type promises is `string | null`.
  for (const [key, value] of Object.entries(initProps ?? {})) {
    if (value !== undefined) {
      Reflect.set(defaults, key, value);
    }
  }

  return createStore<DataGridReducer>()((set) => ({
    ...defaults,
    setPagination: (page, limit) => set(() => ({ page, limit })),
    setSorting: (sort, order) =>
      set(() => ({
        sort: sort ?? DATAGRID_DEFAULT_SORT,
        order: order ?? DATAGRID_DEFAULT_ORDER,
      })),
    setFilter: (filter) => set(() => ({ filter })),
    setSelected: (selected) => set(() => ({ selected })),
    setState: (state) => set(() => ({ ...state })),
  }));
};

/**
 * The type representing a DataGrid Zustand store instance, as returned
 * by the createDataGridStore factory.
 */
export type DataGridStore = ReturnType<typeof createDataGridStore>;
