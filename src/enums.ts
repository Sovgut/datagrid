/**
 * An enumeration defining the possible visibility states for a DataGrid column.
 */
export const DataGridColumnVisibility = {
  /**
   * The column is visible.
   */
  Visible: "Visible",

  /**
   * The column's visibility may be controlled by external factors,
   * such as user permissions or feature flags.
   */
  Restricted: "Restricted",

  /**
   * The column is hidden.
   */
  Hidden: "Hidden",
} as const;

export type DataGridColumnVisibility = (typeof DataGridColumnVisibility)[keyof typeof DataGridColumnVisibility];
