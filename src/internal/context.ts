import { createContext } from "react";

import type { DataGridColumn, DataGridRow, ExpectedAny, Nullable } from "../types.ts";
import type { DataGridReducer } from "../store/store.ts";

/**
 * Describes the core data properties provided by the DataGrid context,
 * including column definitions and the dataset itself.
 */
interface InternalDataGridData<TData> {
  /**
   * The array of column definitions that configure the grid's structure,
   * rendering, and behavior.
   */
  columns: DataGridColumn<TData>[];
  /**
   * The total number of items available from the data source, which is
   * essential for calculating pagination details.
   */
  size: number;
  /**
   * The array of data rows to be displayed for the current page or view
   * of the grid.
   */
  rows: DataGridRow[];
}

/**
 * Defines the complete shape of the internal context provided by the
 * DataSource component. It consolidates the state reducer, loading state,
 * and core data (columns, rows, size) into a single, nullable object.
 */
export type InternalDataGridContextType<TData> = Nullable<DataGridReducer & InternalDataGridData<TData>>;

/**
 * The internal React context used to pass all grid data and actions
 * throughout the DataGrid component tree. This is the primary context
 * consumed by internal hooks and components.
 *
 * @default null
 */
export const InternalDataGridContext = createContext<InternalDataGridContextType<ExpectedAny>>(null);
