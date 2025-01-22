import { createContext } from "react";
import {
  DataGridChangeDetails,
  DataGridColumn,
  DataGridRow,
  IFilterable,
  ILoadable,
  IPaginable,
  ISortable,
} from "./DataGrid.types";

/**
 * Represents the complete state of a DataGrid component
 * Combines pagination, filtering, sorting, and loading capabilities
 *
 * @interface DataGridContextState
 * @extends {IPaginable} - Pagination functionality
 * @extends {IFilterable} - Filtering functionality
 * @extends {ISortable} - Sorting functionality
 * @extends {ILoadable} - Loading state functionality
 */
export interface DataGridContextState
  extends IPaginable,
    IFilterable,
    ISortable,
    ILoadable {
  /**
   * Array of column definitions for the grid
   */
  columns: DataGridColumn[];

  /**
   * Total number of items in the dataset
   */
  size: number;

  /**
   * Array of row data to be displayed
   */
  rows: DataGridRow[];

  /**
   * Callback function triggered when grid state changes
   */
  onChange?: (details: DataGridChangeDetails) => void;
}

/**
 * React Context for sharing DataGrid state throughout the component tree
 * @default null
 */
export const DataGridContext = createContext<DataGridContextState | null>(null);
