import {
  PropsWithChildren,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
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
 * Props for initializing DataGrid state
 */
export interface DataGridInitialProps {
  /**
   * Initial page number
   */
  initialPage?: number;

  /**
   * Initial number of items per page
   */
  initialLimit?: number;

  /**
   * Initial sort column
   */
  initialSort?: ISort;

  /**
   * Initial sort order
   */
  initialOrder?: IOrder;

  /**
   * Initial filter values
   */
  initialFilter?: Record<string, string | string[]>;
}

/**
 * Props for configuring automatic cleanup behavior
 */
export interface DataGridClearableProps {
  /**
   * Automatically clear nullable values from the filter.
   *
   * @default true
   */
  clearNullable?: boolean;

  /**
   * Automatically clear undefined values from the filter.
   *
   * @default true
   */
  clearUndefined?: boolean;

  /**
   * Automatically clear empty string values from the filter.
   *
   * @default true
   */
  clearEmptyString?: boolean;

  /**
   * Automatically clear empty array values from the filter.
   *
   * @default true
   */
  clearEmptyArray?: boolean;
}

/**
 * Props for configuring page reset behavior
 */
export interface DataGridResetProps {
  /**
   * Automatically reset the page to `initial` when the query changes.
   *
   * @default true
   */
  resetPageOnQueryChange?: boolean;
}

/**
 * Main props interface for the DataGrid component
 */
export interface DataGridProps
  extends ILoadable,
    DataGridInitialProps,
    DataGridClearableProps,
    DataGridResetProps,
    PropsWithChildren {
  /**
   * Column definitions for the grid
   */
  columns: DataGridColumn[];

  /**
   * Row data to be displayed
   */
  rows: DataGridRow[];

  /**
   * Total number of items in the dataset
   */
  size: number;

  /**
   * Callback fired when grid state changes
   */
  onChange?: (details: DataGridChangeDetails) => void;

  context?: SharedDataGridContext;

  ref?: Ref<DataGridRef>
}

/**
 * DataGrid component provides a flexible and feature-rich data grid implementation
 * with built-in support for pagination, sorting, filtering, and state management.
 *
 * @example
 * ```tsx
 * <DataGrid
 *   columns={columns}
 *   rows={rows}
 *   size={totalCount}
 *   onChange={handleChange}
 * >
 *   <DataGridContent />
 * </DataGrid>
 * ```
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
      clearEmptyString,
      clearNullable,
      clearUndefined,
      clearEmptyArray,
      onChange,
      context,
      ref,
    } = props

    const [state, dispatch] = useDataGridMerge([context]);

    const hasNextPage = useCallback(
      () => (state.page ?? initialPage) < size,
      [state.page, initialPage, size]
    );
    const hasPrevPage = useCallback(
      () => (state.page ?? initialPage) > 1,
      [state.page, initialPage]
    );

    const prevFilter = useRef(state.filter);

    const shouldClearNullable = useMemo(
      () => clearNullable ?? true,
      [clearNullable]
    );

    const shouldClearUndefined = useMemo(
      () => clearUndefined ?? true,
      [clearUndefined]
    );

    const shouldClearEmptyString = useMemo(
      () => clearEmptyString ?? true,
      [clearEmptyString]
    );

    const shouldClearEmptyArray = useMemo(
      () => clearEmptyArray ?? true,
      [clearEmptyArray]
    );

    const setPage = useCallback(
      (page: number) => {
        dispatch({ page, command: DataGridCommand.SetPage });

        console.debug("DataGrid:setPage", page);
      },
      [dispatch]
    );

    const nextPage = useCallback(() => {
      if (hasNextPage()) {
        console.debug("DataGrid:nextPage");

        setPage((state?.page ?? initialPage) + 1);
      }
    }, [hasNextPage, initialPage, setPage, state?.page]);

    const prevPage = useCallback(() => {
      if (hasPrevPage()) {
        console.debug("DataGrid:prevPage");

        setPage((state?.page ?? initialPage) - 1);
      }
    }, [hasPrevPage, initialPage, setPage, state?.page]);

    const setLimit = useCallback(
      (limit: number) => {
        console.debug("DataGrid:setLimit", limit);

        dispatch({
          limit,
          page: resetPageOnQueryChange ? initialPage : state.page,
          command: DataGridCommand.SetLimit,
        });
      },
      [initialPage, resetPageOnQueryChange, dispatch, state]
    );

    const setSort = useCallback(
      (sort: string) => {
        console.debug("DataGrid:setSort", sort);

        dispatch({
          sort,
          page: resetPageOnQueryChange ? initialPage : state.page,
          command: DataGridCommand.SetSort,
        });
      },
      [initialPage, resetPageOnQueryChange, dispatch, state]
    );

    const clearSort = useCallback(() => {
      console.debug("DataGrid:clearSort");

      dispatch({
        sort: null,
        page: resetPageOnQueryChange ? initialPage : state.page,
        command: DataGridCommand.ClearSort,
      });
    }, [initialPage, resetPageOnQueryChange, dispatch, state]);

    const setOrder = useCallback(
      (order: IOrder) => {
        console.debug("DataGrid:setOrder", order);

        dispatch({
          order,
          page: resetPageOnQueryChange ? initialPage : state.page,
          command: DataGridCommand.SetOrder,
        });
      },
      [initialPage, resetPageOnQueryChange, dispatch, state]
    );

    const toggleOrder = useCallback(() => {
      console.debug("DataGrid:toggleOrder");

      dispatch({
        order:
          state.order === SORT_ASC
            ? SORT_DESC
            : state.order === SORT_DESC
            ? null
            : SORT_ASC,
        page: resetPageOnQueryChange ? initialPage : state.page,
        command: DataGridCommand.ToggleOrder,
      });
    }, [initialPage, resetPageOnQueryChange, dispatch, state]);

    const clearOrder = useCallback(() => {
      console.debug("DataGrid:clearOrder");

      dispatch({
        order: null,
        page: resetPageOnQueryChange ? initialPage : state.page,
        command: DataGridCommand.ClearOrder,
      });
    }, [initialPage, resetPageOnQueryChange, dispatch, state]);

    const setFilter = useCallback(
      (key: string, value: unknown) => {
        console.debug("DataGrid:setFilter", { key, value });

        dispatch({
          filter: {
            [key]: value,
          },
          page: resetPageOnQueryChange ? initialPage : state.page,
          command: DataGridCommand.SetFilter,
        });
      },
      [initialPage, resetPageOnQueryChange, dispatch, state]
    );

    const removeFilter = useCallback(
      (key: string) => {
        console.debug("DataGrid:removeFilter", { key });

        dispatch({
          filter: { [key]: undefined },
          page: resetPageOnQueryChange ? initialPage : state.page,
          command: DataGridCommand.RemoveFilter,
        });
      },
      [initialPage, resetPageOnQueryChange, dispatch, state]
    );

    const replaceFilter = useCallback(
      (value: Record<string, unknown>) => {
        console.debug("DataGrid:replaceFilter", value);

        dispatch({
          filter: value,
          page: resetPageOnQueryChange ? initialPage : state.page,
          command: DataGridCommand.ReplaceFilter,
        });
      },
      [initialPage, resetPageOnQueryChange, dispatch, state]
    );

    const clearFilter = useCallback(() => {
      console.debug("DataGrid:clearFilter");

      dispatch({
        page: resetPageOnQueryChange ? initialPage : state.page,
        command: DataGridCommand.ClearFilter,
      });
    }, [initialPage, resetPageOnQueryChange, dispatch, state]);

    useEffect(() => {
      const details: DataGridChangeDetails = {};

      if (typeof state.page !== "undefined") {
        details.page = state.page;
      }

      if (typeof state.limit !== "undefined") {
        details.limit = state.limit;
      }

      if (typeof state.sort !== "undefined" && state.sort !== null) {
        details.sort = state.sort;
      }

      if (typeof state.order !== "undefined" && state.order !== null) {
        details.order = state.order;
      }

      if (state.filter && Object.keys(state.filter).length > 0) {
        details.filter = state.filter;

        if (shouldClearNullable) {
          CleanSense.null(details.filter);
        }

        if (shouldClearUndefined) {
          CleanSense.undefined(details.filter);
        }

        if (shouldClearEmptyString) {
          CleanSense.string(details.filter);
        }

        if (shouldClearEmptyArray) {
          CleanSense.array(details.filter);
        }
      }

      console.debug("DataGrid:DataGridChangeDetails", details, state.command);

      if (
        !Object.is(prevFilter, details.filter) &&
        state.command === DataGridCommand.SetFilter
      ) {
        const changedKey = extractChangedKey([
          prevFilter.current,
          details.filter,
        ]);

        if (changedKey) {
          const column = columns.find((column) => column.key === changedKey);

          if (column?.debounce) {
            return debounce(
              changedKey,
              () => {
                onChange?.(details);
              },
              column.debounce
            );
          }
        }
      }

      onChange?.(details);
    }, [
      state,
      shouldClearNullable,
      shouldClearUndefined,
      shouldClearEmptyString,
      shouldClearEmptyArray,
      removeFilter,
      columns,
      prevFilter,
      onChange,
    ]);

    useEffect(() => {
      prevFilter.current = state.filter;
    }, [state.filter]);

    useImperativeHandle(ref, () => ({
      setPage,
      setLimit,
      setSort,
      setOrder,
      setFilter,
      replaceFilter,
      removeFilter,
      clearFilter,
      hasNextPage,
      hasPrevPage,
      nextPage,
      prevPage,
      clearOrder,
      clearSort,
      toggleOrder,
    }));

    return (
      <DataGridContext.Provider
        value={{
          page: state.page ?? initialPage,
          limit: state.limit ?? initialLimit,
          sort: state.sort ?? initialSort,
          order: state.order ?? initialOrder,
          filter: state.filter ?? initialFilter,

          setPage,
          setLimit,
          setSort,
          setOrder,
          setFilter,
          replaceFilter,
          removeFilter,
          clearFilter,
          hasNextPage,
          hasPrevPage,
          nextPage,
          prevPage,
          clearOrder,
          clearSort,
          toggleOrder,

          loading: loading ?? false,
          pending: pending ?? false,
          columns,
          rows,
          size,
          onChange,
        }}
      >
        {children}
      </DataGridContext.Provider>
    );
  }
