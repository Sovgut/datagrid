import { useReducer } from "react";
import {
  DEFAULT_FILTER,
  DEFAULT_LIMIT,
  DEFAULT_ORDER,
  DEFAULT_PAGE,
  DEFAULT_SORT,
} from "../constants";
import { DataGridReducer } from "../reducer/DataGridReducer";
import type { SharedDataGridContext } from "../types";
import { DataGridInitialProps } from "../DataGrid";

/**
 * A hook for creating and managing DataGrid state *outside* of the `<DataGrid>` component itself.
 * This "lifts the state up," enabling advanced scenarios such as:
 * - Persisting grid state (e.g., in `localStorage` or URL query parameters).
 * - Sharing state between multiple `DataGrid` instances.
 * - Controlling the grid from a parent component or a global state manager.
 *
 * @param {DataGridInitialProps} [props] - Optional initial values for page, limit, sort, order, and filter.
 * @returns {NonNullable<SharedDataGridContext>} A `[state, dispatch]` tuple for controlling the DataGrid externally.
 */
export function useSharedDataGrid(
  props?: DataGridInitialProps
): NonNullable<SharedDataGridContext> {
  const reducer = useReducer(DataGridReducer, {
    filter: props?.initialFilter ?? DEFAULT_FILTER,
    limit: props?.initialLimit ?? DEFAULT_LIMIT,
    order: props?.initialOrder ?? DEFAULT_ORDER,
    page: props?.initialPage ?? DEFAULT_PAGE,
    sort: props?.initialSort ?? DEFAULT_SORT,
  });

  return reducer;
}
