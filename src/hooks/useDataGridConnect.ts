import { useSharedDataGrid } from "./useSharedDataGrid";
import { SharedDataGridContext } from "../DataGrid.types";

/**
 * Hook for managing DataGrid state context connections
 * 
 * @description
 * Manages the connection between external and internal DataGrid states.
 * Prioritizes external contexts if provided, otherwise falls back to internal state.
 * Useful for composing multiple DataGrid contexts or switching between internal/external state management.
 * 
 * @param {Array<SharedDataGridContext | undefined>} [context] - Array of potential external DataGrid contexts
 * @returns {SharedDataGridContext} The first valid context from the provided array or internal state if none found
 * 
 * @example
 * ```tsx
 * // Using with multiple potential contexts
 * const gridContext = useDataGridConnect([
 *   searchParamsContext,  // URL search params context
 *   externalStateContext, // External state management context
 * ]);
 * 
 * // Using with single external context
 * const gridContext = useDataGridConnect([externalContext]);
 * 
 * // Using with internal state only
 * const gridContext = useDataGridConnect();
 * ```
 * 
 * @returns {SharedDataGridContext} A tuple containing [state, dispatch] for DataGrid
 */
export function useDataGridConnect(
  context?: Array<SharedDataGridContext | undefined>
): SharedDataGridContext {
  const internalReducer = useSharedDataGrid();

  if (context) {
    for (const external of context) {
      if (external) {
        return external;
      }
    }
  }

  return internalReducer;
}
