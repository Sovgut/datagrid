import {
  forwardRef,
  PropsWithChildren,
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
} from "./DataGrid.types";
import { DataGridSourceActionType } from "./DataGrid.reducer";
import { DataGridContext } from "./DataGrid.context";
import {
  DEFAULT_FILTER,
  DEFAULT_LIMIT,
  DEFAULT_ORDER,
  DEFAULT_PAGE,
  DEFAULT_SORT,
  RESET_PAGE_ON_QUERY_CHANGE,
  SORT_ASC,
  SORT_DESC,
} from "./DataGrid.constants";
import { CleanSense } from "./utils/cleanSense";
import { DataGridCommand } from "./DataGrid.enums";
import { debounce } from "./utils/debounce";
import { extractChangedKey } from "./utils/extractChangedKey";
import { useDataGridConnect } from "./hooks/useDataGridConnect";

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
export const DataGrid = forwardRef<DataGridRef, DataGridProps>(
  (
    {
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
    },
    ref
  ) => {
    const [source, setSource] = useDataGridConnect([context]);

    const hasNextPage = useCallback(
      () => (source.page ?? initialPage) < size,
      [source.page, initialPage, size]
    );
    const hasPrevPage = useCallback(
      () => (source.page ?? initialPage) > 1,
      [source.page, initialPage]
    );

    const prevFilter = useRef(source.filter);

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
        setSource({
          type: DataGridSourceActionType.Set,
          value: { ...source, page, command: DataGridCommand.SetPage },
        });

        console.debug("DataGrid:setPage", page);
      },
      [setSource, source]
    );

    const nextPage = useCallback(() => {
      if (hasNextPage()) {
        console.debug("DataGrid:nextPage");

        setPage((source?.page ?? initialPage) + 1);
      }
    }, [hasNextPage, initialPage, setPage, source?.page]);

    const prevPage = useCallback(() => {
      if (hasPrevPage()) {
        console.debug("DataGrid:prevPage");

        setPage((source?.page ?? initialPage) - 1);
      }
    }, [hasPrevPage, initialPage, setPage, source?.page]);

    const setLimit = useCallback(
      (limit: number) => {
        console.debug("DataGrid:setLimit", limit);

        setSource({
          type: DataGridSourceActionType.Set,
          value: {
            ...source,
            limit,
            page: resetPageOnQueryChange ? initialPage : source.page,
            command: DataGridCommand.SetLimit,
          },
        });
      },
      [initialPage, resetPageOnQueryChange, setSource, source]
    );

    const setSort = useCallback(
      (sort: string) => {
        console.debug("DataGrid:setSort", sort);

        setSource({
          type: DataGridSourceActionType.Set,
          value: {
            ...source,
            sort,
            page: resetPageOnQueryChange ? initialPage : source.page,
            command: DataGridCommand.SetSort,
          },
        });
      },
      [initialPage, resetPageOnQueryChange, setSource, source]
    );

    const clearSort = useCallback(() => {
      console.debug("DataGrid:clearSort");

      setSource({
        type: DataGridSourceActionType.Set,
        value: {
          ...source,
          sort: null,
          page: resetPageOnQueryChange ? initialPage : source.page,
          command: DataGridCommand.ClearSort,
        },
      });
    }, [initialPage, resetPageOnQueryChange, setSource, source]);

    const setOrder = useCallback(
      (order: IOrder) => {
        console.debug("DataGrid:setOrder", order);

        setSource({
          type: DataGridSourceActionType.Set,
          value: {
            ...source,
            order,
            page: resetPageOnQueryChange ? initialPage : source.page,
            command: DataGridCommand.SetOrder,
          },
        });
      },
      [initialPage, resetPageOnQueryChange, setSource, source]
    );

    const toggleOrder = useCallback(() => {
      console.debug("DataGrid:toggleOrder");

      setSource({
        type: DataGridSourceActionType.Set,
        value: {
          ...source,
          order:
            source.order === SORT_ASC
              ? SORT_DESC
              : source.order === SORT_DESC
              ? null
              : SORT_ASC,
          page: resetPageOnQueryChange ? initialPage : source.page,
          command: DataGridCommand.ToggleOrder,
        },
      });
    }, [initialPage, resetPageOnQueryChange, setSource, source]);

    const clearOrder = useCallback(() => {
      console.debug("DataGrid:clearOrder");

      setSource({
        type: DataGridSourceActionType.Set,
        value: {
          ...source,
          order: null,
          page: resetPageOnQueryChange ? initialPage : source.page,
          command: DataGridCommand.ClearOrder,
        },
      });
    }, [initialPage, resetPageOnQueryChange, setSource, source]);

    const setFilter = useCallback(
      (key: string, value: unknown) => {
        console.debug("DataGrid:setFilter", { key, value });

        setSource({
          type: DataGridSourceActionType.Set,
          value: {
            ...source,
            filter: {
              ...source.filter,
              [key]: value,
            },
            page: resetPageOnQueryChange ? initialPage : source.page,
            command: DataGridCommand.SetFilter,
          },
        });
      },
      [initialPage, resetPageOnQueryChange, setSource, source]
    );

    const removeFilter = useCallback(
      (key: string) => {
        console.debug("DataGrid:removeFilter", { key });

        setSource({
          type: DataGridSourceActionType.Set,
          value: {
            ...source,
            filter: { ...source.filter, [key]: undefined },
            page: resetPageOnQueryChange ? initialPage : source.page,
            command: DataGridCommand.RemoveFilter,
          },
        });
      },
      [initialPage, resetPageOnQueryChange, setSource, source]
    );

    const replaceFilter = useCallback(
      (value: Record<string, unknown>) => {
        console.debug("DataGrid:replaceFilter", value);

        setSource({
          type: DataGridSourceActionType.Set,
          value: {
            ...source,
            filter: value,
            page: resetPageOnQueryChange ? initialPage : source.page,
            command: DataGridCommand.ReplaceFilter,
          },
        });
      },
      [initialPage, resetPageOnQueryChange, setSource, source]
    );

    const clearFilter = useCallback(() => {
      console.debug("DataGrid:clearFilter");

      setSource({
        type: DataGridSourceActionType.Set,
        value: {
          ...source,
          filter: {},
          page: resetPageOnQueryChange ? initialPage : source.page,
          command: DataGridCommand.ClearFilter,
        },
      });
    }, [initialPage, resetPageOnQueryChange, setSource, source]);

    useEffect(() => {
      const details: DataGridChangeDetails = {};

      if (typeof source.page !== "undefined") {
        details.page = source.page;
      }

      if (typeof source.limit !== "undefined") {
        details.limit = source.limit;
      }

      if (typeof source.sort !== "undefined" && source.sort !== null) {
        details.sort = source.sort;
      }

      if (typeof source.order !== "undefined" && source.order !== null) {
        details.order = source.order;
      }

      if (source.filter && Object.keys(source.filter).length > 0) {
        details.filter = source.filter;

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

      console.debug("DataGrid:DataGridChangeDetails", details, source.command);

      if (
        !Object.is(prevFilter, details.filter) &&
        source.command === DataGridCommand.SetFilter
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
      source,
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
      prevFilter.current = source.filter;
    }, [source.filter]);

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
          page: source.page ?? initialPage,
          limit: source.limit ?? initialLimit,
          sort: source.sort ?? initialSort,
          order: source.order ?? initialOrder,
          filter: source.filter ?? initialFilter,

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
);
