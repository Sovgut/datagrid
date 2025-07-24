import { useRef } from "react";

import { DataSource, type DataGridProps } from "./DataSource.ts";
import { createDataGridStore, type DataGridState } from "./store/store.ts";
import { DataGridStoreContext } from "./store/context.ts";
import type { DataGridRow } from "./types.ts";

/**
 * Defines the properties for the top-level DataGrid component, extending
 * the core DataGridProps with the ability to provide an initial query state.
 */
interface Props<TData> extends DataGridProps<TData> {
  /**
   * An optional object to provide the initial state for pagination,
   * sorting, and filtering. This state is used to initialize the
   * internal Zustand store.
   */
  query?: Partial<DataGridState>;
}

/**
 * The primary entry point for the DataGrid. This component sets up the
 * state management context using Zustand and renders the core data
 * handling logic within the DataSource component. It is responsible for
 * creating and providing the DataGrid store to all its descendants.
 */
export function DataGrid<TData extends DataGridRow>(props: Props<TData>) {
  const { query, ...rest } = props;
  const store = useRef(createDataGridStore(query)).current;

  return (
    <DataGridStoreContext.Provider value={store}>
      <DataSource<TData> {...rest} />
    </DataGridStoreContext.Provider>
  );
}
