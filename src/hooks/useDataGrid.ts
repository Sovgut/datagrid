import { useContext } from "react";
import  {
  DataGridContext,
  type DataGridContextState,
} from "../contexts/DataGridContext";

/**
 * A custom hook to easily and safely access the `DataGridContextState` from any child component
 * rendered within a `<DataGrid>` provider.
 *
 * @returns {NonNullable<DataGridContextState>} The complete state of the DataGrid, including data, pagination state, and action methods.
 * @throws {ReferenceError} If the hook is used outside of a `<DataGrid>` component tree, ensuring it's always used correctly.
 */
export function useDataGrid(): NonNullable<DataGridContextState> {
  const dataGridContext = useContext(DataGridContext);

  if (!dataGridContext) {
    throw new ReferenceError(
      "useDataGrid must be used within a DataGridProvider"
    );
  }

  return dataGridContext;
}
