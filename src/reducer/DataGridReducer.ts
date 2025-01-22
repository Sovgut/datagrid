import { DataGridCommand } from "../enums";
import { IFilterable, IPaginable, ISortable } from "../types";

/**
 * Represents the state shape for DataGrid
 * Combines pagination, sorting, and filtering states with an optional command
 */
export type DataGridState = Partial<
  Pick<IPaginable, "page" | "limit"> &
    Pick<ISortable, "sort" | "order"> &
    Pick<IFilterable, "filter">
> & { command?: DataGridCommand };

/**
 * Type definition for actions that can be dispatched to the reducer
 */
export type DataGridAction = DataGridState & {
  command?: DataGridCommand;
};

/**
 * Reducer function for managing DataGrid state
 *
 * @param state - Current state of the DataGrid
 * @param action - Action to be performed on the state
 * @returns New state after applying the action
 */
export function DataGridReducer(state: DataGridState, action: DataGridAction) {
  const clone = structuredClone(state);

  clone.command = action.command;

  if (action.command === DataGridCommand.SetPage) {
    clone.page = action.page;
  }

  if (action.command === DataGridCommand.SetLimit) {
    clone.limit = action.limit;

    if (clone.page !== action.page) {
      clone.page = action.page;
    }
  }

  if (action.command === DataGridCommand.SetSort) {
    clone.sort = action.sort;

    if (clone.page !== action.page) {
      clone.page = action.page;
    }
  }

  if (action.command === DataGridCommand.SetOrder) {
    clone.order = action.order;

    if (clone.page !== action.page) {
      clone.page = action.page;
    }
  }

  if (
    action.command === DataGridCommand.SetFilter ||
    action.command === DataGridCommand.RemoveFilter
  ) {
    clone.filter = { ...clone.filter, ...action.filter };
  }

  if (action.command === DataGridCommand.ReplaceFilter) {
    clone.filter = action.filter;

    if (clone.page !== action.page) {
      clone.page = action.page;
    }
  }

  if (action.command === DataGridCommand.ClearFilter) {
    clone.filter = {};

    if (clone.page !== action.page) {
      clone.page = action.page;
    }
  }

  if (action.command === DataGridCommand.ClearOrder) {
    clone.order = undefined;

    if (clone.page !== action.page) {
      clone.page = action.page;
    }
  }

  if (action.command === DataGridCommand.ClearSort) {
    clone.sort = undefined;

    if (clone.page !== action.page) {
      clone.page = action.page;
    }
  }

  return clone;
}
