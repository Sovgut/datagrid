/**
 * Available commands for manipulating DataGrid state
 * @enum {string}
 */
export enum DataGridCommand {
  /**
   * Sets the current page number
   */
  SetPage,

  /**
   * Sets the number of items per page
   */
  SetLimit,

  /**
   * Sets the column to sort by
   */
  SetSort,

  /**
   * Sets the sort order (ascending/descending)
   */
  SetOrder,

  /**
   * Sets a filter value for a specific field
   */
  SetFilter,

  /**
   * Replaces all existing filters with new ones
   */
  ReplaceFilter,

  /**
   * Removes a specific filter
   */
  RemoveFilter,

  /**
   * Clears all active filters
   */
  ClearFilter,

  /**
   * Clears the current sort column
   */
  ClearSort,

  /**
   * Clears the current sort order
   */
  ClearOrder,

  /**
   * Toggles between ascending and descending order
   */
  ToggleOrder,
}
