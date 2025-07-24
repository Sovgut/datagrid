import { createContext } from "react";

import type { DataGridStore } from "./store.ts";
import type { Nullable } from "../types.ts";

/**
 * A React context that holds the Zustand store instance for the DataGrid.
 * This allows descendant components to access the store without prop-drilling.
 *
 * @default null
 */
export const DataGridStoreContext = createContext<Nullable<DataGridStore>>(null);
