import { createStore } from "zustand";
import { isNullish } from "utility-types";

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
   * The key of the column by which the data is sorted.
   * @default null
   */
  sort: Nullable<string>;

  /**
   * The direction of the sort.
   * @default null
   */
  order: Nullable<"asc" | "desc">;

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
   */
  setSorting: (sort: DataGridState["sort"], order: DataGridState["order"]) => void;

  /**
   * Sets the filter state.
   */
  setFilter: (filter: DataGridState["filter"]) => void;

  /**
   * Sets the selection state.
   */
  setSelected: (selected: DataGridState["selected"]) => void;
}

/**
 * A factory function that creates a new Zustand store instance for managing
 * the DataGrid's state. It initializes with default values which can be
 * overridden by the provided initial properties.
 */
export const createDataGridStore = (initProps: Nullable<Partial<DataGridState>>) => {
  const props = initProps ?? {};
  const DEFAULT_PROPS: DataGridState = {
    page: DATAGRID_DEFAULT_PAGE,
    limit: DATAGRID_DEFAULT_LIMIT,
    sort: DATAGRID_DEFAULT_SORT,
    order: DATAGRID_DEFAULT_ORDER,
    filter: DATAGRID_DEFAULT_FILTER,
    selected: DATAGRID_DEFAULT_SELECTED,
  };

  return createStore<DataGridReducer>()((set) => ({
    ...DEFAULT_PROPS,
    ...props,
    setPagination: (page, limit) => set(() => ({ page, limit })),
    setSorting: (sort, order) =>
      set(() => ({
        sort: isNullish(sort) ? DATAGRID_DEFAULT_SORT : sort,
        order: isNullish(order) ? DATAGRID_DEFAULT_ORDER : order,
      })),
    setFilter: (filter) => set(() => ({ filter })),
    setSelected: (selected) => set(() => ({ selected })),
  }));
};

/**
 * The type representing a DataGrid Zustand store instance, as returned
 * by the createDataGridStore factory.
 */
export type DataGridStore = ReturnType<typeof createDataGridStore>;
