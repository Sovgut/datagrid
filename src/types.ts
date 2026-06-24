import type { ComponentType, ReactElement, ReactNode, RefObject } from "react";
import type { Nullish } from "utility-types";

import type { DataGridColumnVisibility } from "./enums.ts";
import type { DataGridReducer, DataGridState } from "./store/store.ts";

/**
 * A utility type for situations where a value can be of any type.
 * Should be used sparingly.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExpectedAny = any;

/**
 * A utility type representing a value that can be T, null, or undefined.
 */
export type Nullable<T> = T | Nullish;

/**
 * Defines the required structure for a row of data in the grid.
 * Each row must have a unique `id`.
 */
export interface DataGridRow {
  /**
   * A unique identifier for the row, used for keying and selection.
   */
  id: string | number;
  [key: string]: ExpectedAny;
}

/**
 * Defines the props passed to a custom cell component when using the
 * `component` property in a column definition.
 */
export interface DataGridComponentProps<TData> {
  /**
   * The data object for the current row.
   */
  row: TData;

  /**
   * The numerical index of the current row.
   */
  index: number;

  /**
   * The complete array of rows currently being rendered.
   */
  rows: TData[];
}

/**
 * Describes the full, advanced filter configuration for a single column.
 */
interface ColumnFilterConfig {
  /**
   * A pure function for describing dynamic prop generation for the `component`.
   *
   * This function runs *during the render phase* and is used to
   * dynamically configure the filter's UI based on the current global filter state.
   *
   * The props returned from this function will be merged with the component's
   * original props. The grid's internal `value` and `onChange` props
   * will always take precedence.
   *
   * @param props - The component's original static props (from `component.props`).
   * @param context - The current filter context, containing `filter` state.
   * @returns An object of props to be merged into the `component`.
   */
  deriveProps?: (props: Readonly<Record<string, ExpectedAny>>, context: DataGridState) => Record<string, ExpectedAny>;

  /**
   * A function for describing derived state logic (state synchronization).
   *
   * This function runs *after render* (inside `useEffect`) and is used to
   * validate or synchronize the filter state.
   *
   * **Note:** The DataGrid should pass a *deep clone* of the context to this
   * function, allowing the function to safely mutate the context object
   * to produce a new state.
   *
   * @param context - A *clone* of the current filter context.
   * This function is allowed to mutate this object directly.
   * @returns The (potentially mutated) context object.
   */
  deriveState?: (context: DataGridState) => DataGridState;
}

/**
 * The context object passed to a `ColumnFilter` render function.
 * It contains the controlled input props that the DataGrid injects
 * into the filter element.
 */
export interface ColumnFilterContext {
  /**
   * The current filter value for this column.
   */
  value: string | string[] | undefined;

  /**
   * Updates the filter value for this column.
   */
  onChange: (value: string | string[] | undefined) => void;

  /**
   * Called when the filter input loses focus.
   */
  onBlur: () => void;

  /**
   * Called on key press events (e.g., to submit the filter on Enter).
   */
  onKeyPress: (event: KeyboardEvent) => void;

  /**
   * A ref attached to the underlying input element for imperative access.
   */
  ref: RefObject<HTMLElement | null>;
}

/**
 * Defines the shape of a column filter. Accepts either:
 * - A `ReactElement` — a plain JSX element (e.g. `<input>`, `<Select />`).
 *   The grid will clone it and inject controlled props (`value`, `onChange`, etc.)
 *   via `React.cloneElement`.
 * - A render function `(ctx: ColumnFilterContext) => ReactElement` — provides full
 *   control over how the filter is rendered by receiving the controlled props directly,
 *   without relying on `React.cloneElement`.
 */
export type ColumnFilter = ReactElement | ((ctx: ColumnFilterContext) => ReactElement);

/**
 * Defines the core properties for a column in the DataGrid.
 */
interface BaseDataGridColumn<TData, TMetadata = Record<string, ExpectedAny>> {
  /**
   * A unique key for the column, typically corresponding to a property
   * in the TData object.
   */
  key: keyof TData | (string & {});

  /**
   * The text to display in the column header.
   */
  label: string;

  /**
   * Enables or disables sorting on this column.
   * @default false
   */
  sortable?: boolean;

  /**
   * Defines the filter UI for this column. Accepts either a plain React element
   * or a render function receiving a {@link ColumnFilterContext}.
   *
   * When a `ReactElement` is provided, the DataGrid clones it and injects
   * controlled props (`value`, `onChange`, `onBlur`, `onKeyPress`, `ref`) via
   * `React.cloneElement`. The `ref` targets the root DOM element of the filter.
   *
   * When a function is provided, it is called with a `ColumnFilterContext` object,
   * giving you full control over how these props are applied to your element.
   *
   * @example
   * // Plain element — props are injected via cloneElement
   * filter: <input type="text" placeholder="Search..." />
   *
   * @example
   * // Render function — full control over prop wiring
   * filter: (ctx) => <input value={ctx.value ?? ""} onChange={(e) => ctx.onChange(e.target.value)} />
   */
  filter?: ColumnFilter;

  /**
   * Describes the full, advanced filter configuration for a single column.
   */
  filterConfig?: ColumnFilterConfig;

  /**
   * Controls the visibility of the column.
   * @default DataGridColumnVisibility.Visible
   */
  visibility?: DataGridColumnVisibility;

  /**
   * Indicates if the filter for this column can accept multiple values.
   */
  multiple?: boolean;

  /**
   * A container for any additional custom data associated with the column.
   */
  metadata?: TMetadata;
}

/**
 * Defines the mutually exclusive strategies for rendering a cell's content.
 * A column must use `render`, `component`, or neither, but not both.
 */
type RenderStrategy<TData> =
  | {
      /**
       * A function that returns a ReactNode to be rendered in the cell.
       */
      render: (row: TData, index: number, rows: TData[]) => ReactNode;
      component?: never;
    }
  | {
      /**
       * A React component to be rendered for the cell. It will receive
       * `row`, `index`, and `rows` as props.
       */
      component: ComponentType<DataGridComponentProps<TData>>;
      render?: never;
    }
  | {
      render?: never;
      component?: never;
    };

/**
 * The complete definition for a DataGrid column, combining the base
 * properties with a specific rendering strategy.
 */
export type DataGridColumn<TData, TMetadata = Record<string, ExpectedAny>> = BaseDataGridColumn<TData, TMetadata> &
  RenderStrategy<TData>;

/**
 * Defines the imperative API exposed by the DataGrid's ref. It includes
 * all state reducers plus internal methods.
 */
export type DataGridRef = DataGridReducer & {
  /**
   * A function that resets all grid states (pagination, sorting, filtering,
   * selection) to their default values.
   */
  clear: () => void;
};
