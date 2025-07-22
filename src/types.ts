import type { Dispatch, ReactElement, ReactNode } from "react";
import type { DataGridAction, DataGridState } from "./reducer/DataGridReducer";
import type { DataGridColumnVisibility } from "./enums";

/** A utility type for permissive props where any type is acceptable. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExpectedAny = any;

/**
 * Defines the shape for pagination state and the actions available to control it.
 */
export interface IPaginable {
  /** The current, active page number. */
  page: number;

  /** The maximum number of items to display per page. */
  limit: number;

  /** A function that returns `true` if a next page exists. */
  hasNextPage: () => boolean;

  /** A function that returns `true` if a previous page exists. */
  hasPrevPage: () => boolean;

  /** A function to navigate to a specific page number. */
  setPage: (page: number) => void;

  /** A function to change the number of items per page. */
  setLimit: (limit: number) => void;

  /** A function to navigate to the next page, if available. */
  nextPage: () => void;

  /** A function to navigate to the previous page, if available. */
  prevPage: () => void;
}

/**
 * Defines the shape for filtering state and the actions available to control it.
 */
export interface IFilterable {
  /** An object representing the current filter state, where keys are column identifiers and values are the filter values. */
  filter: Record<string, unknown>;

  /** A function to set or update the filter value for a specific key. */
  setFilter: (key: string, value: unknown) => void;

  /** A function to replace the entire filter object with a new one. */
  replaceFilter: (value: Record<string, unknown>) => void;

  /** A function to remove a filter for a specific key. */
  removeFilter: (key: string) => void;

  /** A function to remove all active filters. */
  clearFilter: () => void;
}

/**
 * Defines the shape for sorting state and the actions available to control it.
 */
export interface ISortable {
  /** The key of the column currently being sorted. `null` if no sort is active. */
  sort: ISort;

  /** The current sort direction ('asc', 'desc', or `null`). */
  order: IOrder;

  /** A function to set the active sort column by its key. */
  setSort: (sort: string) => void;

  /** A function to clear the active sort column. */
  clearSort: () => void;

  /** A function to set the sort direction explicitly. */
  setOrder: (order: IOrder) => void;

  /** A function to cycle through sort directions (asc -> desc -> null -> asc). */
  toggleOrder: () => void;

  /** A function to clear the sort direction. */
  clearOrder: () => void;
}

/**
 * Defines loading and pending states for the grid to provide feedback on asynchronous operations.
 */
export interface ILoadable {
  /** When `true`, indicates that initial data is being fetched or a major refetch is in progress. Typically used to show a full-screen loader or skeleton. */
  loading?: boolean;

  /** When `true`, indicates a smaller, background operation is in progress (e.g., pagination, sorting). Typically used to show a smaller spinner or disable controls. */
  pending?: boolean;
}

/** Represents the sort direction. `null` indicates no sorting. */
export type IOrder = "asc" | "desc" | null;

/** Represents the key of the column being sorted. `null` indicates no sorting. */
export type ISort = string | null;

/**
 * Defines the required structure for a single row of data provided to the grid.
 */
export interface DataGridRow {
  /** A unique identifier for the row, essential for React keys and data manipulation. */
  id: string | number;

  /** Allows for any other properties on the row object, providing flexibility for different data structures. */
  [key:string]: ExpectedAny;
}

/**
 * Defines the complete configuration for a single grid column.
 */
export interface DataGridColumn {
  /** A unique key identifying the column. This should typically match a key in the `DataGridRow` data objects. */
  key: string;

  /** The display label for the column header, shown to the user. */
  label: string;

  /** If `true`, this column can be sorted by clicking its header. */
  sortable?: boolean;

  /** A React element to be rendered as a custom filter control for this column (e.g., a text input, a select dropdown). */
  filter?: ReactElement<ExpectedAny>;

  /**
   * Controls the column's visibility and the user's ability to change it via the UI.
   * @see DataGridColumnVisibility
   * @default DataGridColumnVisibility.Visible
   */
  visibility?: DataGridColumnVisibility;

  /** If `true`, indicates that this column's filter can accept multiple values (e.g., for multi-select filters). */
  multiple?: boolean;

  /**
   * A custom render function for the cells in this column. It provides a way to format data or render complex components inside a cell.
   * @param row - The data for the entire current row.
   * @param index - The index of the current row.
   * @param rows - The array of all rows currently displayed.
   * @returns The `ReactNode` to be rendered in the cell.
   */
  render?: (row: ExpectedAny, index: number, rows: ExpectedAny[]) => ReactNode;

  /**
   * A debounce delay in milliseconds for this column's filter. When a user types in a filter input, the `onChange` event will be delayed
   * by this amount to prevent excessive re-renders or API calls. If `0` or `undefined`, debouncing is disabled.
   */
  debounce?: number;

  /** A free-form object to attach any other custom data or configuration to the column definition, useful for custom renderers or plugins. */
  metadata?: Record<string, ExpectedAny>;
}

/**
 * Defines the imperative handle exposed by the `DataGrid` component's `ref`.
 * This allows a parent component to programmatically call actions on the grid.
 * It omits state properties (`page`, `limit`, etc.) and only exposes action methods.
 */
export type DataGridRef = Omit<IPaginable, "page" | "limit"> &
  Omit<ISortable, "sort" | "order"> &
  Omit<IFilterable, "filter"> & {
    clear: () => void
  };

/**
 * Defines the shape of the details object passed to the `onChange` callback.
 * This object contains a snapshot of the grid's current query state (page, sort, filter),
 * making it easy to use for API requests or URL synchronization.
 */
export type DataGridChangeDetails = Partial<
  Pick<IPaginable, "page" | "limit"> &
    Pick<ISortable, "sort" | "order"> &
    Pick<IFilterable, "filter">
>;

/**
 * Represents the context tuple `[state, dispatch]` used for shared state management,
 * following the pattern established by `React.useReducer`.
 * @property {DataGridState} 0 - The current state object of the data grid.
 * @property {Dispatch<DataGridAction>} 1 - The dispatch function used to send actions and update the state.
 */
export type SharedDataGridContext = [DataGridState, Dispatch<DataGridAction>];
