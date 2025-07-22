/**
 * Defines the set of commands that can be dispatched to manipulate the DataGrid state.
 * Each command represents a specific state transition.
 */
export enum DataGridCommand {
  /** Triggers a change to the current page number for pagination. */
  SetPage,

  /** Triggers a change to the number of items displayed per page. */
  SetLimit,

  /** Triggers a change to the column key used for sorting. */
  SetSort,

  /** Triggers a change to the sort direction ('asc' or 'desc'). */
  SetOrder,

  /** Triggers the setting or updating of a single filter value by its key. */
  SetFilter,

  /** Triggers the replacement of the entire filter object with a new one. */
  ReplaceFilter,

  /** Triggers the removal of a single filter by its key. */
  RemoveFilter,

  /** Triggers the removal of all active filters, resetting to an empty state. */
  ClearFilter,

  /** Triggers the removal of the active sort column, disabling sorting. */
  ClearSort,

  /** Triggers the removal of the active sort direction. */
  ClearOrder,

   /** Triggers the removal of all states. */
  ClearAll,

  /** Triggers a toggle of the sort direction (asc -> desc -> null -> asc). */
  ToggleOrder,
}

/**
 * Defines the visibility states for a column within a data grid,
 * including whether the state can be changed by the user in the UI.
 */
export enum DataGridColumnVisibility {
  /** The column is visible by default and can be hidden by the user. */
  Visible = "Visible",

  /** The column is permanently hidden and cannot be made visible by the user. This is for data that is needed for logic but not for display. */
  Restricted = "Restricted",

  /** The column is hidden by default but can be made visible by the user. */
  Hidden = "Hidden",
}
