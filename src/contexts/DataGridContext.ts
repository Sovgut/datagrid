import { createContext } from "react";
import type {
  DataGridChangeDetails,
  DataGridColumn,
  DataGridRow,
  IFilterable,
  ILoadable,
  IPaginable,
  ISortable,
} from "../types";
import { DataGridCommand } from "../enums";
import { DataGridState } from "../main";

/**
 * Represents the complete, resolved state provided by the `DataGridContext`.
 * This interface combines all modular capabilities (pagination, sorting, filtering, loading)
 * with the core data (`columns`, `rows`, `size`) and action methods.
 * It is the single source of truth for all child components consuming the context.
 */
export interface DataGridContextState
  extends IPaginable,
    IFilterable,
    ISortable,
    ILoadable {
  /** The array of column definitions currently used by the grid. */
  columns: DataGridColumn[];

  /** The total number of items in the entire dataset, used for calculating total pages and other metadata. */
  size: number;

  /** The array of row data for the currently displayed page. */
  rows: DataGridRow[];

  /** An optional callback function triggered when any part of the grid's query state (page, sort, filter) changes. */
  onChange?: (details: DataGridChangeDetails) => void;

  setCommands: (commands: DataGridCommand[], payload: Partial<DataGridState>) => void;
}

/**
 * A React Context that provides the `DataGridContextState` to all descendant components.
 * This allows components like headers, footers, pagination controls, and custom cells
 * to access the grid's state and action methods without prop drilling.
 * @default null
 */
export const DataGridContext = createContext<DataGridContextState | null>(null);
