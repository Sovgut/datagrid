import { useSharedDataGrid } from "./useSharedDataGridContext";
import type { SharedDataGridContext } from "../types";

/**
 * A utility hook that selects the definitive DataGrid state context to use for the `<DataGrid>` component.
 * It iterates through an array of potential external contexts and uses the first valid one it finds.
 * If no valid external context is provided, it falls back to creating its own internal state.
 * This makes it easy to build components that can be either controlled (from the outside) or uncontrolled (managing their own state).
 *
 * @param {Array<SharedDataGridContext | undefined>} [context] - An optional array of external `[state, dispatch]` contexts to prioritize.
 * @returns {NonNullable<SharedDataGridContext>} The first valid external context from the array, or a newly created internal context if none are found.
 */
export function useDataGridMerge(
  context?: Array<SharedDataGridContext | undefined>
): NonNullable<SharedDataGridContext> {
  const internalReducer = useSharedDataGrid();

  if (context) {
    for (const external of context) {
      if (external) {
        return external; // Use the first valid external context.
      }
    }
  }

  return internalReducer; // Fallback to internal state.
}
