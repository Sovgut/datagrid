import { DataGridCommand } from "./DataGrid.enums";
import { IFilterable, IPaginable, ISortable } from "./DataGrid.types";

/**
 * Represents the state shape for DataGrid source
 * Combines pagination, sorting, and filtering states with an optional command
 */
export type DataGridSourceState = Partial<
  Pick<IPaginable, "page" | "limit"> &
    Pick<ISortable, "sort" | "order"> &
    Pick<IFilterable, "filter">
> & { command?: DataGridCommand };

/**
 * Enum for DataGrid source actions
 */
export enum DataGridSourceActionType {
  /** 
   * Action to set new state 
   */
  Set,
}

/**
 * Type definition for actions that can be dispatched to the reducer
 */
export type DataGridSourceAction = {
  /** 
   * Action type 
   */
  type: DataGridSourceActionType.Set;

  /** 
   * New state values to be set 
   */
  value: DataGridSourceState & { command?: DataGridCommand };
};

/**
 * Reducer function for managing DataGrid source state
 * 
 * @param state - Current state of the DataGrid source
 * @param action - Action to be performed on the state
 * @returns New state after applying the action
 */
export function DataGridSourceReducer(
  state: DataGridSourceState,
  action: DataGridSourceAction
) {
  const clone = structuredClone(state);

  if (action.type === DataGridSourceActionType.Set) {
    return action.value;
  }

  return clone;
}
