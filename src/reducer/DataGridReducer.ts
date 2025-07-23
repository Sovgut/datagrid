import { DEFAULT_PAGE } from "../constants";
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
> & { commands?: DataGridCommand[] };

/**
 * The shape of an action that can be dispatched to the reducer. It includes the
 * new state values and the command that triggered the update.
 */
export type DataGridAction = DataGridState & {
  commands?: DataGridCommand[];
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
  const clone = typeof window.structuredClone !== 'undefined' ? window.structuredClone(state) : JSON.parse(JSON.stringify(state));

  clone.commands = action.commands;

  // If there are no commands, no state change is needed besides updating the command list.
  if (!action.commands?.length) {
    return clone;
  }

  // Create a set of commands that trigger a page reset for efficient lookup.
  const pageResettingCommands = new Set([
    DataGridCommand.SetLimit,
    DataGridCommand.SetSort,
    DataGridCommand.SetOrder,
    DataGridCommand.ToggleOrder,
    DataGridCommand.ReplaceFilter,
    DataGridCommand.ClearFilter,
    DataGridCommand.ClearOrder,
    DataGridCommand.ClearSort,
  ]);

  // Determine if the page number should be reset.
  const shouldResetPage = action.commands.some(cmd => pageResettingCommands.has(cmd));

  // Handle each command to update the state accordingly.
  action.commands.forEach(command => {
    switch (command) {
      case DataGridCommand.SetPage: {
        clone.page = action.page;
        break;
      }
      case DataGridCommand.SetLimit: {
        clone.limit = action.limit;
        break;
      }
      case DataGridCommand.SetSort: {
        clone.sort = action.sort;
        break;
      }
      case DataGridCommand.SetOrder:
      case DataGridCommand.ToggleOrder: {
        clone.order = action.order;
        break;
      }
      case DataGridCommand.SetFilter:
      case DataGridCommand.RemoveFilter: {
        clone.filter = { ...clone.filter, ...action.filter };
        break;
      }
      case DataGridCommand.ReplaceFilter: {
        clone.filter = action.filter;
        break;
      }
      case DataGridCommand.ClearFilter: {
        clone.filter = {};
        break;
      }
      case DataGridCommand.ClearOrder: {
        clone.order = null;
        break;
      }
      case DataGridCommand.ClearSort: {
        clone.sort = null;
        break;
      }
      default: {
        break;
      }
    }
  });

  if (shouldResetPage) {
    clone.page = DEFAULT_PAGE;
  }

  return clone;
}
