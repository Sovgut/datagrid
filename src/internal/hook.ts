import { type Context, useContext } from "react";

import { InternalDataGridContext, type InternalDataGridContextType } from "./context.ts";
import { useDataGridStore } from "../store/hook.ts";
import type { DataGridRow } from "../types.ts";
import type { DataGridReducer } from "../store/store.ts";

/**
 * The primary consumer hook for the DataGrid. It provides access to the
 * complete grid state, including data, column definitions, and state
 * management actions. This is the main hook intended for use by child
 * components of DataGrid.
 *
 * @throws {ReferenceError} Throws an error if used outside of a
 * DataGrid context provider.
 */
export function useDataGrid<TData extends DataGridRow>(): NonNullable<InternalDataGridContextType<TData>> {
  const context = useContext(InternalDataGridContext as Context<InternalDataGridContextType<TData>>);

  if (!context) {
    throw new ReferenceError("useDataGrid should be used only within DataGrid");
  }

  return context;
}

/**
 * An internal hook that abstracts the logic for selecting a state source.
 * It returns the externally provided store if it exists; otherwise, it
 * falls back to the internal Zustand store.
 */
export function useDataGridState(externalStore?: DataGridReducer): NonNullable<DataGridReducer> {
  const internalStore = useDataGridStore((store) => store);

  if (externalStore) {
    return externalStore;
  }

  return internalStore;
}
