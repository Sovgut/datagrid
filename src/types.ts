import { Dispatch, ReactElement, ReactNode } from "react";
import { DataGridAction, DataGridState } from "./reducer/DataGridReducer";

/**
 * Interface for pagination functionality
 */
export interface IPaginable {
  /**
   * Current page number
   */
  page: number;

  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Checks if there is a next page available
   */
  hasNextPage: () => boolean;

  /**
   * Checks if there is a previous page available
   */
  hasPrevPage: () => boolean;

  /**
   * Sets the current page number
   */
  setPage: (page: number) => void;

  /**
   * Sets the number of items per page
   */
  setLimit: (limit: number) => void;

  /**
   * Navigates to the next page
   */
  nextPage: () => void;

  /**
   * Navigates to the previous page
   */
  prevPage: () => void;
}

/**
 * Interface for filtering functionality
 */
export interface IFilterable {
  /**
   * Current filter state
   */
  filter: Record<string, unknown>;

  /**
   * Sets a filter value for a specific key
   */
  setFilter: (key: string, value: unknown) => void;

  /**
   * Replaces all current filters with new ones
   */
  replaceFilter: (value: Record<string, unknown>) => void;

  /**
   * Removes a specific filter
   */
  removeFilter: (key: string) => void;

  /**
   * Clears all filters
   */
  clearFilter: () => void;
}

/**
 * Interface for sorting functionality.
 * Supports sorting by a single column at a time.
 */
export interface ISortable {
  /**
   * Current active sort column key.
   * Only one column can be sorted at a time.
   */
  sort: ISort;

  /**
   * Current sort order for the active sort column
   */
  order: IOrder;

  /**
   * Sets the sort column
   */
  setSort: (sort: string) => void;

  /**
   * Clears the sort column
   */
  clearSort: () => void;

  /**
   * Sets the sort order
   */
  setOrder: (order: IOrder) => void;

  /**
   * Toggles between ascending and descending order
   */
  toggleOrder: () => void;

  /**
   * Clears the sort order
   */
  clearOrder: () => void;
}

/**
 * Interface for loading states
 */
export interface ILoadable {
  /**
   * Indicates if data is being loaded
   */
  loading?: boolean;

  /**
   * Indicates if an operation is pending
   */
  pending?: boolean;
}

/**
 * Sort order type
 */
export type IOrder = "asc" | "desc" | null;
/**
 * Sort column type
 */
export type ISort = string | null;

/**
 * Interface for grid row data
 */
export interface DataGridRow {
  /**
   * Unique identifier for the row
   */
  id: string | number;

  /**
   * Additional row data
   */
  [key: string]: ExpectedAny;
}

/**
 * Configuration interface for grid columns
 */
export interface DataGridColumn {
  /**
   * Unique key for the column.
   *
   *
   * ```ts
   * <DataGridContext>.columns[index].key
   * ```
   */
  key: string;

  /**
   * Label for the column.
   *
   *
   * ```ts
   * <DataGridContext>.columns[index].label
   * ```
   */
  label: string;

  /**
   * Enables sorting for the column.
   *
   *
   * ```ts
   * <DataGridContext>.columns[index].sortable
   * ```
   */
  sortable?: boolean;

  /**
   * Allow to use filters for the column.
   *
   *
   * ```ts
   * <DataGridContext>.columns[index].filter
   * ```
   */
  filter?: ReactElement<ExpectedAny>;

  /**
   * Hides the column from the grid.
   *
   *
   * ```ts
   * <DataGridContext>.columns[index].hidden
   * ```
   */
  hidden?: boolean;

  /**
   * Allows to filter the column by multiple values.
   *
   * ```ts
   * <DataGridContext>.columns[index].multiple
   * ```
   */
  multiple?: boolean;

  /**
   * Custom render function for the column.
   *
   *
   * ```ts
   * <DataGridContext>.columns[index].render(
   *  <DataGridContext>.rows[index],
   *  index,
   *  <DataGridContext>.rows[index],
   *  index,
   *  <DataGridContext>.rows,
   * )
   * ```
   */
  render?: (row: ExpectedAny, index: number, rows: ExpectedAny[]) => ReactNode;

  /**
   * Enable debounce for the column.
   *
   * **Value is in milliseconds**.
   *
   * If value is `0` or `undefined`, debounce will be disabled.
   *
   * ```ts
   * <DataGridContext>.columns[index].debounce
   * ```
   */
  debounce?: number;

  /**
   * Allows to pass **any** data to the column.
   *
   *
   * ```ts
   * <DataGridContext>.columns[index].metadata
   * ```
   */
  metadata?: Record<string, ExpectedAny>;
}

/**
 * DataGrid reference type excluding state properties
 */
export type DataGridRef = Omit<IPaginable, "page" | "limit"> &
  Omit<ISortable, "sort" | "order"> &
  Omit<IFilterable, "filter">;

/**
 * Type for grid state change event details
 */
export type DataGridChangeDetails = Partial<
  Pick<IPaginable, "page" | "limit"> &
    Pick<ISortable, "sort" | "order"> &
    Pick<IFilterable, "filter">
>;

/**
 * Type alias for any value (used for flexibility in generic contexts)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExpectedAny = any;

/**
 * Represents the shared context tuple for the DataGrid component's state management.
 * This type follows the React Context pattern for managing grid data state.
 *
 * @property {DataGridState} [0] - Current state of the data grid
 * @property {Dispatch<DataGridAction>} [1] - Dispatch function to update the grid state
 *
 * @example
 * const [gridState, dispatch] = useContext<SharedDataGridContext>(DataGridContext);
 */
export type SharedDataGridContext = [DataGridState, Dispatch<DataGridAction>];
