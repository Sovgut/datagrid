import { type PropsWithChildren, type Ref, useCallback, useEffect, useImperativeHandle, useMemo } from "react";

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
import type { DataGridColumn, DataGridRef, DataGridRow } from "./types.ts";
import { deepCopy } from "./utils.ts";

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
export interface DataGridProps<TData> extends DataGridResetProps, PropsWithChildren {
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
    columns = [],
    rows = [],
    size = 0,
    children,
    store,
    ref,
    onChange,
    onSelect,
  } = props;

  const state = useDataGridState(store);
  const { setState } = state;

  const { derivedState, shouldChange } = useMemo(() => {
    const localSnapshot: Pick<DataGridState, "page" | "limit" | "sort" | "order" | "filter" | "selected"> = {
      page: state.page ?? DATAGRID_DEFAULT_PAGE,
      limit: state.limit ?? DATAGRID_DEFAULT_LIMIT,
      sort: state.sort ?? DATAGRID_DEFAULT_SORT,
      order: state.order ?? DATAGRID_DEFAULT_ORDER,
      filter: state.filter ?? DATAGRID_DEFAULT_FILTER,
      selected: state.selected ?? DATAGRID_DEFAULT_SELECTED,
    };

    let localCurrentState = deepCopy(localSnapshot);
    let localShouldChange = false;

    for (const column of columns) {
      if (typeof column.filterConfig?.deriveState === "function") {
        localCurrentState = column.filterConfig.deriveState(localCurrentState);
      }
    }

    if (!localShouldChange && localSnapshot.page !== localCurrentState.page) {
      localShouldChange = true;
    }

    if (!localShouldChange && localSnapshot.limit !== localCurrentState.limit) {
      localShouldChange = true;
    }

    if (!localShouldChange && localSnapshot.sort !== localCurrentState.sort) {
      localShouldChange = true;
    }

    if (!localShouldChange && localSnapshot.order !== localCurrentState.order) {
      localShouldChange = true;
    }

    if (!localShouldChange && JSON.stringify(localSnapshot.selected) !== JSON.stringify(localCurrentState.selected)) {
      localShouldChange = true;
    }

    if (!localShouldChange && JSON.stringify(localSnapshot.filter) !== JSON.stringify(localCurrentState.filter)) {
      localShouldChange = true;
    }

    return { derivedState: localCurrentState, shouldChange: localShouldChange };
  }, [columns, state.filter, state.limit, state.order, state.page, state.selected, state.sort]);

  const onInternalSetPage: DataGridReducer["setPagination"] = useCallback(
    (page, limit) => {
      const newState = { ...derivedState, page, limit };
      setState(newState);
      onChange?.(newState);
    },
    [derivedState, setState, onChange]
  );

  const onInternalSetSort: DataGridReducer["setSorting"] = useCallback(
    (sort, order) => {
      const newPage = resetPageOnQueryChange ? DATAGRID_DEFAULT_PAGE : derivedState.page;
      const newState = { ...derivedState, page: newPage, sort, order };

      setState(newState);
      onChange?.(newState);
    },
    [resetPageOnQueryChange, derivedState, setState, onChange]
  );

  const onInternalSetFilter: DataGridReducer["setFilter"] = useCallback(
    (filter) => {
      const newPage = resetPageOnQueryChange ? DATAGRID_DEFAULT_PAGE : derivedState.page;
      const newFilter = filter ?? DATAGRID_DEFAULT_FILTER;
      const newState = { ...derivedState, page: newPage, filter: newFilter };

      setState(newState);
      onChange?.(newState);
    },
    [resetPageOnQueryChange, derivedState, setState, onChange]
  );

  const onInternalSetSelected: DataGridReducer["setSelected"] = useCallback(
    (selected) => {
      const newSelected = selected ?? DATAGRID_DEFAULT_SELECTED;
      const newState = { ...derivedState, selected: newSelected };

      setState(newState);
      onSelect?.(newSelected);
    },
    [derivedState, setState, onSelect]
  );

  const onInternalSetState: DataGridReducer["setState"] = useCallback(
    (newState) => {
      setState(newState);
      onChange?.(newState);
      onSelect?.(newState.selected);
    },
    [setState, onChange, onSelect]
  );

  const clear = useCallback(() => {
    const defaultState = {
      page: DATAGRID_DEFAULT_PAGE,
      limit: DATAGRID_DEFAULT_LIMIT,
      sort: DATAGRID_DEFAULT_SORT,
      order: DATAGRID_DEFAULT_ORDER,
      filter: DATAGRID_DEFAULT_FILTER,
      selected: DATAGRID_DEFAULT_SELECTED,
    };
    setState(defaultState);
    onChange?.(defaultState);
    onSelect?.(defaultState.selected);
  }, [setState, onChange, onSelect]);

  useEffect(() => {
    if (shouldChange) {
      onInternalSetState(derivedState);
    }
  }, [shouldChange, derivedState, onInternalSetState]);

  useImperativeHandle(ref, () => ({
    ...derivedState,
    setSelected: onInternalSetSelected,
    setPagination: onInternalSetPage,
    setSorting: onInternalSetSort,
    setFilter: onInternalSetFilter,
    setState: onInternalSetState,
    columns: columns ?? [],
    rows: rows ?? [],
    size: size ?? 0,
    clear,
  }));

  const contextValue = useMemo<InternalDataGridContextType<TData>>(
    () => ({
      ...derivedState,
      setSelected: onInternalSetSelected,
      setPagination: onInternalSetPage,
      setSorting: onInternalSetSort,
      setFilter: onInternalSetFilter,
      setState: onInternalSetState,
      columns: columns ?? [],
      rows: rows ?? [],
      size: size ?? 0,
    }),
    [
      derivedState,
      onInternalSetFilter,
      onInternalSetPage,
      onInternalSetSort,
      onInternalSetSelected,
      onInternalSetState,
      columns,
      rows,
      size,
    ]
  );

  return <InternalDataGridContext.Provider value={contextValue}>{children}</InternalDataGridContext.Provider>;
}
