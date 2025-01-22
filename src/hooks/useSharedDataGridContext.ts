import { useReducer } from "react";
import {
  DEFAULT_FILTER,
  DEFAULT_LIMIT,
  DEFAULT_ORDER,
  DEFAULT_PAGE,
  DEFAULT_SORT,
} from "../constants";
import { DataGridReducer } from "../reducer/DataGridReducer";
import { SharedDataGridContext } from "../types";
import { DataGridInitialProps } from "../DataGrid";

/**
 * External hook for managing DataGrid state outside of the DataGrid component
 *
 * @description
 * This hook provides external state management for DataGrid, allowing you to:
 * - Control DataGrid state from a parent component
 * - Share state between multiple DataGrids
 * - Persist DataGrid state in your application
 * - Handle complex state management scenarios
 *
 * @param {DataGridInitialProps} [props] - Optional initial configuration
 * @returns {SharedDataGridContext} [state, dispatch] tuple for external DataGrid control
 *
 * @example
 * ```tsx
 * // Parent component
 * const [dataGrid, setDataGrid] = useSharedDataGrid({
 *   initialLimit: 25,
 *   initialPage: 1
 * });
 *
 * return (›
 *   <DataGrid
 *     context={[dataGrid, setDataGrid]}
 *     // ... other props
 *   />
 * );
 * ```
 */
export function useSharedDataGrid(
  props?: DataGridInitialProps
): SharedDataGridContext {
  const reducer = useReducer(DataGridReducer, {
    filter: props?.initialFilter ?? DEFAULT_FILTER,
    limit: props?.initialLimit ?? DEFAULT_LIMIT,
    order: props?.initialOrder ?? DEFAULT_ORDER,
    page: props?.initialPage ?? DEFAULT_PAGE,
    sort: props?.initialSort ?? DEFAULT_SORT,
  });

  return reducer;
}
