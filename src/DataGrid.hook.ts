import { useContext } from "react";
import { DataGridContext, DataGridContextState } from "./DataGrid.context";

/**
 * Custom hook to access the DataGrid context state
 * 
 * @returns The DataGrid context state containing grid configuration and data
 * @throws {ReferenceError} When used outside of a DataGridProvider
 * 
 * @example
 * function MyComponent() {
 *   const { data, loading } = useDataGrid();
 *   return loading ? <Loader /> : <div>{data.length} items</div>;
 * }
 */
export function useDataGrid(): DataGridContextState {
  const dataGridContext = useContext(DataGridContext);

  if (!dataGridContext) {
    throw new ReferenceError(
      "useDataGrid must be used within a DataGridProvider"
    );
  }

  return dataGridContext;
}
