import { type PropsWithChildren, type Ref, useCallback, useImperativeHandle, useMemo } from "react";

import {
  DATAGRID_DEFAULT_FILTER,
  DATAGRID_DEFAULT_LIMIT,
  DATAGRID_DEFAULT_ORDER,
  DATAGRID_DEFAULT_PAGE,
  DATAGRID_DEFAULT_SELECTED,
  DATAGRID_DEFAULT_SORT,
  DATAGRID_RESET_PAGE_ON_QUERY_CHANGE,
} from "./constants.ts";
import { useDataGridState } from "./internal/hook.ts";
import { InternalDataGridContext, type InternalDataGridContextType } from "./internal/context.ts";
import type { DataGridState, DataGridReducer } from "./store/store.ts";
import type { DataGridColumn, DataGridRef, DataGridLoadingState, DataGridRow } from "./types.ts";

/**
 * Defines configuration for how the grid's page state should behave
 * when query parameters like sorting or filtering are changed.
 */
export interface DataGridResetProps {
  /**
   * If true, the grid will reset to the first page whenever the
   * sort or filter query changes.
   *
   * @default true
   */
  resetPageOnQueryChange?: boolean;
}

/**
 * Defines the core properties for the data handling and rendering layer
 * of the DataGrid. It accepts data, column definitions, and state callbacks.
 */
export interface DataGridProps<TData> extends DataGridLoadingState, DataGridResetProps, PropsWithChildren {
  /**
   * An array of column definition objects that specify how the grid's
   * header and cells should be rendered and behave.
   */
  columns: DataGridColumn<TData>[];

  /**
   * An array of data objects to be displayed in the grid. Each object
   * must conform to the DataGridRow interface (i.e., include an `id`).
   */
  rows: DataGridRow[];

  /**
   * The total number of items available from the data source, which is
   * used to calculate total pages for pagination.
   */
  size: number;

  /**
   * An optional external state manager. If provided, the grid will use this
   * store instead of its internal Zustand-based state.
   */
  store?: DataGridReducer;

  /**
   * A ref that provides imperative access to the grid's API, allowing
   * parent components to control its state and behavior directly.
   */
  ref?: Ref<DataGridRef>;

  /**
   * A callback function that is invoked whenever the grid's state
   * (pagination, sorting, filtering) changes.
   */
  onChange?: (query: DataGridState) => void;

  /**
   * A callback function that is invoked when row selection changes.
   */
  onSelect?: (selected: string[]) => void;
}

/**
 * A component responsible for orchestrating the DataGrid's state, logic,
 * and context. It handles state changes, executes callbacks, exposes an
 * imperative API via a ref, and provides all necessary data and actions
 * to its children through the InternalDataGridContext.
 */
export function DataSource<TData extends DataGridRow>(props: DataGridProps<TData>) {
  const {
    resetPageOnQueryChange = DATAGRID_RESET_PAGE_ON_QUERY_CHANGE,
    loading = false,
    pending = false,
    columns = [],
    rows = [],
    size = 0,
    children,
    store,
    ref,
    onChange,
    onSelect,
  } = props;

  const { page, limit, setPagination, sort, order, setSorting, filter, setFilter, selected, setSelected } =
    useDataGridState(store);

  const onInternalSetPage: DataGridReducer["setPagination"] = useCallback(
    (page, limit) => {
      setPagination(page, limit);

      onChange?.({
        page,
        limit,
        sort,
        order,
        filter,
        selected,
      });
    },
    [setPagination, onChange, sort, order, filter, selected]
  );

  const onInternalSetSort: DataGridReducer["setSorting"] = useCallback(
    (sort, order) => {
      const newPage = resetPageOnQueryChange ? DATAGRID_DEFAULT_PAGE : page;

      setSorting(sort, order);
      setPagination(newPage, limit);

      onChange?.({
        page: newPage,
        limit,
        sort,
        order,
        filter,
        selected,
      });
    },
    [setSorting, setPagination, page, onChange, limit, filter, resetPageOnQueryChange, selected]
  );

  const onInternalSetFilter: DataGridReducer["setFilter"] = useCallback(
    (filter) => {
      const newPage = resetPageOnQueryChange ? DATAGRID_DEFAULT_PAGE : page;

      setFilter(filter ?? DATAGRID_DEFAULT_FILTER);
      setPagination(newPage, limit);

      onChange?.({
        page: newPage,
        limit,
        sort,
        order,
        filter: filter ?? DATAGRID_DEFAULT_FILTER,
        selected,
      });
    },
    [onChange, setPagination, resetPageOnQueryChange, page, setFilter, limit, sort, order, selected]
  );

  const onInternalSetSelected: DataGridReducer["setSelected"] = useCallback(
    (selected) => {
      setSelected(selected ?? DATAGRID_DEFAULT_SELECTED);
      onSelect?.(selected ?? DATAGRID_DEFAULT_SELECTED);
    },
    [setSelected, onSelect]
  );

  const clear = useCallback(() => {
    setPagination(DATAGRID_DEFAULT_PAGE, DATAGRID_DEFAULT_LIMIT);
    setSorting(DATAGRID_DEFAULT_SORT, DATAGRID_DEFAULT_ORDER);
    setFilter(DATAGRID_DEFAULT_FILTER);
    setSelected(DATAGRID_DEFAULT_SELECTED);

    onChange?.({
      page: DATAGRID_DEFAULT_PAGE,
      limit: DATAGRID_DEFAULT_LIMIT,
      sort: DATAGRID_DEFAULT_SORT,
      order: DATAGRID_DEFAULT_ORDER,
      filter: DATAGRID_DEFAULT_FILTER,
      selected: DATAGRID_DEFAULT_SELECTED,
    });

    onSelect?.(DATAGRID_DEFAULT_SELECTED);
  }, [setPagination, setSorting, setFilter, setSelected, onChange, onSelect]);

  useImperativeHandle(ref, () => ({
    page: page ?? DATAGRID_DEFAULT_PAGE,
    limit: limit ?? DATAGRID_DEFAULT_LIMIT,
    sort: sort ?? DATAGRID_DEFAULT_SORT,
    order: order ?? DATAGRID_DEFAULT_ORDER,
    filter: filter ?? DATAGRID_DEFAULT_FILTER,
    selected: selected ?? DATAGRID_DEFAULT_SELECTED,
    setSelected: onInternalSetSelected,
    setPagination: onInternalSetPage,
    setSorting: onInternalSetSort,
    setFilter: onInternalSetFilter,
    loading: loading ?? false,
    pending: pending ?? false,
    clear,
  }));

  const contextValue = useMemo<InternalDataGridContextType<TData>>(
    () => ({
      page: page ?? DATAGRID_DEFAULT_PAGE,
      limit: limit ?? DATAGRID_DEFAULT_LIMIT,
      sort: sort ?? DATAGRID_DEFAULT_SORT,
      order: order ?? DATAGRID_DEFAULT_ORDER,
      filter: filter ?? DATAGRID_DEFAULT_FILTER,
      selected: selected ?? DATAGRID_DEFAULT_SELECTED,
      setSelected: onInternalSetSelected,
      setPagination: onInternalSetPage,
      setSorting: onInternalSetSort,
      setFilter: onInternalSetFilter,
      loading: loading ?? false,
      pending: pending ?? false,
      columns: columns ?? [],
      rows: rows ?? [],
      size: size ?? 0,
    }),
    [
      columns,
      loading,
      pending,
      rows,
      selected,
      onInternalSetFilter,
      onInternalSetPage,
      onInternalSetSort,
      onInternalSetSelected,
      size,
      filter,
      limit,
      order,
      page,
      sort,
    ]
  );

  return <InternalDataGridContext.Provider value={contextValue}>{children}</InternalDataGridContext.Provider>;
}
