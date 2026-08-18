import type { ComponentType, ReactElement, ReactNode } from "react";

import type { DataGridColumnVisibility } from "./enums.ts";
import type { DataGridReducer, DataGridState } from "./store/store.ts";

/**
 * A value that is either `null` or `undefined`.
 */
type Nullish = null | undefined;

/**
 * A utility type for situations where a value can be of any type.
 * Should be used sparingly.
 */
// biome-ignore lint/suspicious/noExplicitAny: this type intentionally aliases `any`, that is its purpose
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

  /**
   * Arbitrary cell values, keyed by column key.
   *
   * The value type is deliberately `any` rather than `unknown`. Two things
   * break if it is narrowed:
   *
   * 1. An `interface` does not get an implicit index signature in TypeScript
   *    (only type aliases and object literals do), so `interface User { name: string }`
   *    would stop satisfying `DataGridRow` and every grid mounted with an
   *    interface-typed row would fail to compile.
   * 2. `unknown` is not assignable to `ReactNode`, so rendering `row[column.key]`
   *    directly, which is what an unstyled table body does, would stop compiling.
   *
   * Prefer parameterizing the grid with your own row type (`useDataGrid<User>()`)
   * over reading through this index signature.
   */
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
export interface ColumnFilterConfig {
  /**
   * A pure function for describing dynamic prop generation for the filter
   * element, used to configure it from the current global filter state (a
   * "method" filter whose options depend on the selected "currency", say).
   *
   * **This headless core never calls it.** It is a declaration your rendering
   * layer reads during its own render phase, merging the result into the
   * filter element. The split is deliberate: only the layer that owns the
   * markup knows how to apply props to it, whether that is `cloneElement`, a
   * render prop or something else. See `deriveState` for the counterpart the
   * core does run.
   *
   * By convention the returned props are merged over the element's original
   * props, and the controlled `value` and `onChange` supplied by the rendering
   * layer take precedence over both.
   *
   * @param props - The component's original static props (from `component.props`).
   * @param context - The current filter context, containing `filter` state.
   * @returns An object of props to be merged into the `component`.
   */
  deriveProps?: (props: Readonly<Record<string, ExpectedAny>>, context: DataGridState) => Record<string, ExpectedAny>;

  /**
   * A function for describing derived state logic (state synchronization).
   *
   * Unlike `deriveProps`, this one **is** called by the grid itself, once per
   * column that declares it, in column order. Each function receives what the
   * previous one returned, so a later column sees the earlier column's result.
   *
   * The context handed in is a copy the function may mutate: the state object,
   * its `filter` object and its `selected` array are all fresh. Values nested
   * inside a filter entry are shared with the store by reference, so replace
   * them rather than editing them in place.
   *
   * @param context - A copy of the current grid state.
   * This function is allowed to mutate this object directly.
   * @returns The (potentially mutated) context object.
   */
  deriveState?: (context: DataGridState) => DataGridState;
}

/**
 * Defines the two forms a column filter can take.
 *
 * - **`ReactElement`** - a plain JSX element. The consuming component is
 *   responsible for injecting controlled props (e.g. `value`, `onChange`)
 *   into it, typically via `React.cloneElement`.
 * - **Render function** `(ctx: T) => ReactElement` - a function that receives
 *   a context object of type `T` and returns a `ReactElement`, giving full
 *   control over how the filter element is built without relying on `cloneElement`.
 *
 * @template T - The type of the context object passed to the render function.
 * Defaults to `ExpectedAny` so the type can be narrowed by the consuming component.
 */
export type ColumnFilter<T = ExpectedAny> = ReactElement | ((ctx: T) => ReactElement);

/**
 * Defines the core properties for a column in the DataGrid.
 */
interface BaseDataGridColumn<TMetadata = Record<string, ExpectedAny>, TFilterContext = ExpectedAny> {
  /**
   * A unique key for the column, typically corresponding to a property
   * in the TData object.
   *
   * This is a contract, not a caption: it is simultaneously the filter key, the
   * name a URL-syncing plugin uses as a query parameter, and the identifier a
   * saved column layout is stored under. Renaming one breaks shared links and
   * stored settings.
   *
   * It is a plain `string` rather than `keyof TData | (string & {})`. That
   * spelling promised autocompletion it could not deliver: because `TData`
   * inherits `[key: string]` from {@link DataGridRow}, `keyof TData` already
   * widens to `string | number`, so the union collapsed to `string | number`
   * and quietly accepted a numeric key.
   */
  key: string;

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
   * The filter UI definition for this column. Accepts either a plain
   * `ReactElement` (the consuming component injects controlled props via
   * `cloneElement`) or a render function that receives a context of type
   * `TFilterContext` and returns a `ReactElement` for full control over
   * how the controlled props are applied.
   */
  filter?: ColumnFilter<TFilterContext>;

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
export type DataGridColumn<
  TData,
  TMetadata = Record<string, ExpectedAny>,
  TFilterContext = ExpectedAny,
> = BaseDataGridColumn<TMetadata, TFilterContext> & RenderStrategy<TData>;

/**
 * The imperative API exposed through the grid's `ref`: every state value, every
 * action, the data the grid was given, and `clear`.
 *
 * Pass your row type to have `rows` and `columns` typed:
 *
 * ```ts
 * const grid = useRef<DataGridRef<User>>(null);
 * grid.current?.rows[0]?.name; // string | undefined
 * ```
 *
 * The type parameter defaults to `ExpectedAny` rather than to
 * {@link DataGridRow}, and that choice is load-bearing. `DataGridColumn` is
 * contravariant in its row type through `render` and `component`, so
 * `DataGridRef<DataGridRow>` would **not** be assignable to
 * `DataGridRef<User>`, and every unparameterized `useRef<DataGridRef>()` would
 * have to be annotated. Defaulting to `ExpectedAny` keeps the bare form
 * compatible with every instantiation while losing nothing for anyone who does
 * name their row type.
 */
export type DataGridRef<TData extends DataGridRow = ExpectedAny> = DataGridReducer & {
  /**
   * The column definitions currently handed to the grid.
   */
  columns: DataGridColumn<TData>[];

  /**
   * The rows currently handed to the grid, which is the current page rather
   * than the whole data source.
   */
  rows: TData[];

  /**
   * The total number of items in the data source.
   */
  size: number;

  /**
   * Resets pagination, sorting, filtering and selection to the package
   * defaults, then applies the columns' `deriveState`.
   *
   * Note that the baseline is the `DATAGRID_DEFAULT_*` constants, **not** the
   * `query` prop the grid started with. To return to your own baseline, call
   * `setState` with it instead.
   */
  clear: () => void;
};
