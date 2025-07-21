import { DataGridCommand } from "../enums";
import type { IFilterable, IPaginable, ISortable } from "../types";

/**
 * The shape of the DataGrid's internal state object, which holds the current
 * query parameters (page, limit, sort, filter) and the last command executed.
 */
export type DataGridState = Partial<
  Pick<IPaginable, "page" | "limit"> &
    Pick<ISortable, "sort" | "order"> &
    Pick<IFilterable, "filter">
> & { command?: DataGridCommand };

/**
 * The shape of an action that can be dispatched to the reducer. It includes the
 * new state values and the command that triggered the update.
 */
export type DataGridAction = DataGridState & {
  command?: DataGridCommand;
};

/**
 * A pure function that manages all state transitions for the DataGrid based on dispatched actions.
 * It takes the current state and an action, and returns a new, updated state object.
 *
 * @param {DataGridState} state - The current state of the grid.
 * @param {DataGridAction} action - The action to be performed, containing the command and payload.
 * @returns {DataGridState} The new state after applying the action.
 */
export function DataGridReducer(state: DataGridState, action: DataGridAction): DataGridState {
  // Use structuredClone for a deep, safe copy to prevent direct state mutation.
  const clone = structuredClone(state);

  clone.command = action.command;

  // Reset the page number for any action that changes the dataset's content or order.
  const shouldResetPage =
    action.command === DataGridCommand.SetLimit ||
    action.command === DataGridCommand.SetSort ||
    action.command === DataGridCommand.SetOrder ||
    action.command === DataGridCommand.ToggleOrder ||
    action.command === DataGridCommand.ReplaceFilter ||
    action.command === DataGridCommand.ClearFilter ||
    action.command === DataGridCommand.ClearOrder ||
    action.command === DataGridCommand.ClearSort;

  // Handle each command to update the state accordingly.
  switch (action.command) {
    case DataGridCommand.SetPage:
      clone.page = action.page;
      break;
    case DataGridCommand.SetLimit:
      clone.limit = action.limit;
      break;
    case DataGridCommand.SetSort:
      clone.sort = action.sort;
      break;
    case DataGridCommand.SetOrder:
    case DataGridCommand.ToggleOrder:
      clone.order = action.order;
      break;
    case DataGridCommand.SetFilter:
    case DataGridCommand.RemoveFilter:
      clone.filter = { ...clone.filter, ...action.filter };
      break;
    case DataGridCommand.ReplaceFilter:
      clone.filter = action.filter;
      break;
    case DataGridCommand.ClearFilter:
      clone.filter = {};
      break;
    case DataGridCommand.ClearOrder:
      clone.order = null;
      break;
    case DataGridCommand.ClearSort:
      clone.sort = null;
      break;
  }

  if (shouldResetPage) {
    clone.page = action.page; // Assumes the initial page is passed in the action
  }

  return clone;
}
