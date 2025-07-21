import {
  type PropsWithChildren,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type {
  DataGridChangeDetails,
  DataGridColumn,
  DataGridRef,
  DataGridRow,
  SharedDataGridContext,
  ILoadable,
  IOrder,
  ISort,
} from "./types";
import { DataGridContext } from "./contexts/DataGridContext";
import {
  DEFAULT_FILTER,
  DEFAULT_LIMIT,
  DEFAULT_ORDER,
  DEFAULT_PAGE,
  DEFAULT_SORT,
  RESET_PAGE_ON_QUERY_CHANGE,
  SORT_ASC,
  SORT_DESC,
} from "./constants";
import { CleanSense } from "./utils/cleanSense";
import { DataGridCommand } from "./enums";
import { debounce } from "./utils/debounce";
import { extractChangedKey } from "./utils/extractChangedKey";
import { useDataGridMerge } from "./hooks/useDataGridMerge";

/**
 * Defines props for setting the initial, uncontrolled state of the DataGrid.
 * These are only used on the initial render.
 */
export interface DataGridInitialProps {
  /** The page number the grid should start on. @default 1 */
  initialPage?: number;

  /** The number of items per page the grid should start with. @default 10 */
  initialLimit?: number;

  /** The key of the column to sort by initially. @default null */
  initialSort?: ISort;

  /** The sort direction to use initially. @default null */
  initialOrder?: IOrder;

  /** The filter values to apply on the initial render. @default {} */
  initialFilter?: Record<string, string | string[]>;
}

/**
 * Defines props for configuring the automatic cleanup of filter values.
 * This helps ensure the `onChange` payload is clean and ready for use.
 */
export interface DataGridClearableProps {
  /** If `true`, `null` values are automatically removed from the filter object before `onChange` is called. @default true */
  clearNullable?: boolean;

  /** If `true`, `undefined` values are automatically removed from the filter object. @default true */
  clearUndefined?: boolean;

  /** If `true`, empty string values and empty strings within arrays are removed from the filter object. @default true */
  clearEmptyString?: boolean;

  /** If `true`, empty array values are removed from the filter object. @default true */
  clearEmptyArray?: boolean;
}

/**
 * Defines props for configuring the automatic page reset behavior.
 */
export interface DataGridResetProps {
  /** If `true`, the page number will reset to its `initialPage` value whenever filters or sorting criteria are changed. @default true */
  resetPageOnQueryChange?: boolean;
}

/**
 * The complete set of props for the main `<DataGrid>` component.
 */
export interface DataGridProps
  extends ILoadable,
    DataGridInitialProps,
    DataGridClearableProps,
    DataGridResetProps,
    PropsWithChildren {
  /** An array of `DataGridColumn` objects that define the structure and behavior of the grid's columns. */
  columns: DataGridColumn[];

  /** An array of `DataGridRow` objects representing the data for the currently visible page. */
  rows: DataGridRow[];

  /** The total number of items in the entire dataset (across all pages). This is crucial for calculating pagination. */
  size: number;

  /** A callback function that is fired whenever the grid's query state (page, sort, filter, limit) changes. It receives a `details` object containing the new state. */
  onChange?: (details: DataGridChangeDetails) => void;

  /**
   * An optional `[state, dispatch]` tuple from `useSharedDataGrid`. Providing this makes the DataGrid a "controlled" component,
   * where its state is managed externally.
   * @see useSharedDataGrid
   */
  context?: SharedDataGridContext;

  /** An optional `ref` to gain imperative access to the grid's action methods (e.g., `ref.current.nextPage()`). */
  ref?: Ref<DataGridRef>;
}

/**
 * A powerful and flexible data grid component that provides a comprehensive, out-of-the-box solution
 * for displaying tabular data with built-in support for pagination, sorting, filtering, and advanced
 * state management via React Context and Hooks.
 */
export function DataGrid(props: DataGridProps) {
  const {
    initialPage = DEFAULT_PAGE,
    initialLimit = DEFAULT_LIMIT,
    initialSort = DEFAULT_SORT,
    initialOrder = DEFAULT_ORDER,
    initialFilter = DEFAULT_FILTER,
    resetPageOnQueryChange = RESET_PAGE_ON_QUERY_CHANGE,
    loading,
    pending,
    children,
    columns,
    rows,
    size,
    clearEmptyString = true,
    clearNullable = true,
    clearUndefined = true,
    clearEmptyArray = true,
    onChange,
    context,
    ref,
  } = props;

  // This hook intelligently selects an external context if provided, otherwise it creates and uses its own internal state.
  const [state, dispatch] = useDataGridMerge([context]);

  const hasNextPage = useCallback(() => (state.page ?? initialPage) * (state.limit ?? initialLimit) < size, [state.page, state.limit, initialPage, initialLimit, size]);
  const hasPrevPage = useCallback(() => (state.page ?? initialPage) > 1, [state.page, initialPage]);
  const prevFilter = useRef(state.filter);

  /** Navigates to a specific page number. */
  const setPage = useCallback((page: number) => {
    dispatch({
      command: DataGridCommand.SetPage,
      page,
    });
  }, [dispatch]);

  /** Navigates to the next page, if one is available. */
  const nextPage = useCallback(() => {
    if (hasNextPage()) {
      setPage((state?.page ?? initialPage) + 1);
    }
  }, [hasNextPage, initialPage, setPage, state?.page]);

  /** Navigates to the previous page, if one is available. */
  const prevPage = useCallback(() => {
    if (hasPrevPage()) {
      setPage((state?.page ?? initialPage) - 1);
    }
  }, [hasPrevPage, initialPage, setPage, state?.page]);

  /** Sets the number of items per page, optionally resetting to the first page. */
  const setLimit = useCallback((limit: number) => {
    dispatch({
      command: DataGridCommand.SetLimit,
      limit,
      page: resetPageOnQueryChange ? initialPage : state.page,
    });
  }, [dispatch, initialPage, resetPageOnQueryChange, state.page]);

  /** Sets the active sort column, optionally resetting to the first page. */
  const setSort = useCallback((sort: string) => {
    dispatch({
      command: DataGridCommand.SetSort,
      sort,
      page: resetPageOnQueryChange ? initialPage : state.page,
    });
  }, [dispatch, initialPage, resetPageOnQueryChange, state.page]);

  /** Clears the active sort column, optionally resetting to the first page. */
  const clearSort = useCallback(() => {
    dispatch({
      command: DataGridCommand.ClearSort,
      sort: null,
      page: resetPageOnQueryChange ? initialPage : state.page,
    });
  }, [dispatch, initialPage, resetPageOnQueryChange, state.page]);

  /** Explicitly sets the sort order ('asc' or 'desc'), optionally resetting to the first page. */
  const setOrder = useCallback((order: IOrder) => {
    dispatch({
      command: DataGridCommand.SetOrder,
      order,
      page: resetPageOnQueryChange ? initialPage : state.page,
    });
  }, [dispatch, initialPage, resetPageOnQueryChange, state.page]);

  /** Cycles through sort orders (asc -> desc -> none), optionally resetting to the first page. */
  const toggleOrder = useCallback(() => {
    const nextOrder = state.order === SORT_ASC ? SORT_DESC : state.order === SORT_DESC ? null : SORT_ASC;
    dispatch({
      command: DataGridCommand.ToggleOrder,
      order: nextOrder,
      page: resetPageOnQueryChange ? initialPage : state.page,
    });
  }, [dispatch, initialPage, resetPageOnQueryChange, state.order, state.page]);

  /** Clears the sort order, optionally resetting to the first page. */
  const clearOrder = useCallback(() => {
    dispatch({
      command: DataGridCommand.ClearOrder,
      order: null,
      page: resetPageOnQueryChange ? initialPage : state.page,
    });
  }, [dispatch, initialPage, resetPageOnQueryChange, state.page]);

  /** Sets or updates a single filter value by its key, optionally resetting to the first page. */
  const setFilter = useCallback((key: string, value: unknown) => {
    dispatch({
      command: DataGridCommand.SetFilter,
      filter: { [key]: value },
      page: resetPageOnQueryChange ? initialPage : state.page,
    });
  }, [dispatch, initialPage, resetPageOnQueryChange, state.page]);

  /** Removes a single filter by its key. */
  const removeFilter = useCallback((key: string) => {
    dispatch({
      command: DataGridCommand.RemoveFilter,
      filter: { [key]: undefined },
      page: resetPageOnQueryChange ? initialPage : state.page,
    });
  }, [dispatch, initialPage, resetPageOnQueryChange, state.page]);

  /** Replaces the entire filter object with a new one. */
  const replaceFilter = useCallback((value: Record<string, unknown>) => {
    dispatch({
      command: DataGridCommand.ReplaceFilter,
      filter: value,
      page: resetPageOnQueryChange ? initialPage : state.page,
    });
  }, [dispatch, initialPage, resetPageOnQueryChange, state.page]);

  /** Clears all active filters, returning to an empty filter state. */
  const clearFilter = useCallback(() => {
    dispatch({
      command: DataGridCommand.ClearFilter,
      page: resetPageOnQueryChange ? initialPage : state.page,
    });
  }, [dispatch, initialPage, resetPageOnQueryChange, state.page]);

  // This effect listens for state changes, constructs a clean `details` object, and calls the `onChange` prop.
  // It also handles debouncing for filter inputs.
  useEffect(() => {
    const details: DataGridChangeDetails = {};

    if (state.page !== undefined) details.page = state.page;
    if (state.limit !== undefined) details.limit = state.limit;
    if (state.sort) details.sort = state.sort;
    if (state.order) details.order = state.order;

    if (state.filter && Object.keys(state.filter).length > 0) {
      details.filter = { ...state.filter }; // Clone to avoid mutation by CleanSense

      if (clearNullable) CleanSense.null(details.filter);
      if (clearUndefined) CleanSense.undefined(details.filter);
      if (clearEmptyString) CleanSense.string(details.filter);
      if (clearEmptyArray) CleanSense.array(details.filter);
    }

    // If a filter has changed, check if its column has a debounce configuration.
    if (!Object.is(prevFilter.current, details.filter) && state.command === DataGridCommand.SetFilter) {
      const changedKey = extractChangedKey([prevFilter.current, details.filter]);

      if (changedKey) {
        const column = columns.find((c) => c.key === changedKey);

        if (column?.debounce) {
          return debounce(changedKey, () => onChange?.(details), column.debounce);
        }
      }
    }

    onChange?.(details);
  }, [state, clearNullable, clearUndefined, clearEmptyString, clearEmptyArray, columns, onChange]);

  // This effect keeps `prevFilter` in sync with the current filter state for the next render's comparison.
  useEffect(() => {
    prevFilter.current = state.filter;
  }, [state.filter]);

  // This hook exposes the grid's action methods on the `ref` object for imperative control by parent components.
  useImperativeHandle(ref, () => ({ setPage, setLimit, setSort, setOrder, setFilter, replaceFilter, removeFilter, clearFilter, hasNextPage, hasPrevPage, nextPage, prevPage, clearOrder, clearSort, toggleOrder }));

  // The component provides all resolved state and actions to its children via the DataGridContext.Provider.
  return (
    <DataGridContext.Provider
      value={{
        page: state.page ?? initialPage,
        limit: state.limit ?? initialLimit,
        sort: state.sort ?? initialSort,
        order: state.order ?? initialOrder,
        filter: state.filter ?? initialFilter,
        setPage, setLimit, setSort, setOrder, setFilter, replaceFilter, removeFilter, clearFilter,
        hasNextPage, hasPrevPage, nextPage, prevPage, clearOrder, clearSort, toggleOrder,
        loading: loading ?? false,
        pending: pending ?? false,
        columns, rows, size, onChange,
      }}
    >
      {children}
    </DataGridContext.Provider>
  );
}
