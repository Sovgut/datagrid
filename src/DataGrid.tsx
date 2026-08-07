import { type ReactElement, useState } from "react";

import { DataSource, type DataSourceProps } from "./DataSource.tsx";
import { DataGridStoreContext } from "./store/context.ts";
import { createDataGridStore, type DataGridReducer, type DataGridState } from "./store/store.ts";
import type { DataGridRow } from "./types.ts";

/**
 * The two mutually exclusive ways to decide where the grid's state lives.
 *
 * They are alternatives, not independent props, and the type says so: passing
 * both is a compile error. It used to be silently meaningless instead, because
 * a grid given a `store` never reads the internal one that `query` seeds, so
 * the initial state was quietly dropped.
 */
type StateStrategy =
  | {
      /**
       * Seeds the grid's own state, on the first render only.
       *
       * Changing it afterwards does nothing: the grid owns the state from then
       * on, and pair this with `onChange` if the parent needs to follow along.
       * This is the uncontrolled path, the counterpart of `defaultValue`.
       */
      query?: Partial<DataGridState>;
      store?: never;
    }
  | {
      /**
       * Hands ownership of the state to you: any object satisfying
       * `DataGridReducer` will do, and the grid reads and writes through it
       * instead of its own.
       *
       * This is the controlled path, the counterpart of `value`, and the
       * extension point `@sovgut/datagrid-react-router` is built on. Since the
       * state is yours, seed it where you create it rather than through
       * `query`.
       */
      store: DataGridReducer;
      query?: never;
    };

/**
 * The props accepted by the `DataGrid` component: everything the data and
 * rendering layer takes, plus a choice of where the state lives.
 */
export type DataGridProps<TData extends DataGridRow> = Omit<DataSourceProps<TData>, "store"> & StateStrategy;

/**
 * The primary entry point for the DataGrid. This component sets up the
 * state management context using Zustand and renders the core data
 * handling logic within the DataSource component. It is responsible for
 * creating and providing the DataGrid store to all its descendants.
 */
export function DataGrid<TData extends DataGridRow>(props: DataGridProps<TData>): ReactElement {
  const { query, ...rest } = props;
  const [store] = useState(() => createDataGridStore(query));

  return (
    <DataGridStoreContext.Provider value={store}>
      <DataSource<TData> {...rest} />
    </DataGridStoreContext.Provider>
  );
}
