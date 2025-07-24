import { useContext } from "react";
import { useStore } from "zustand";

import { DataGridStoreContext } from "./context.ts";
import type { DataGridReducer } from "./store.ts";

/**
 * A custom hook for accessing and subscribing to the DataGrid's Zustand
 * store. It uses a selector function to extract specific slices of state,
 * optimizing re-renders.
 *
 * @throws {ReferenceError} Throws an error if used outside of a
 * DataGridStoreContext.Provider.
 */
export function useDataGridStore<T>(selector: (state: DataGridReducer) => T): T {
  const context = useContext(DataGridStoreContext);

  if (!context) {
    throw new ReferenceError("useDataGridStore must be used only within DataGridStoreContext");
  }

  return useStore(context, selector);
}
