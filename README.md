# @sovgut/datagrid

<p align="center">
Headless state management for React data grids. It owns pagination, sorting, per-column filters, selection and column visibility, and leaves every pixel of markup to you.
</p>

<p align="center">
<img src="https://img.shields.io/npm/v/@sovgut/datagrid" alt="npm version" />
<img src="https://img.shields.io/npm/dm/@sovgut/datagrid" alt="npm downloads" />
<img src="https://img.shields.io/github/license/sovgut/datagrid" alt="license" />
<img src="https://img.shields.io/badge/TypeScript-Ready-blue" alt="TypeScript" />
</p>

## Contents

- [What this is, and what it is not](#what-this-is-and-what-it-is-not)
- [Installation](#installation)
- [Core concepts](#core-concepts)
- [Quick start](#quick-start)
- [The state lifecycle](#the-state-lifecycle)
- [Columns](#columns)
- [Filters](#filters)
- [`deriveState` and `deriveProps`](#derivestate-and-deriveprops)
- [Who owns the state](#who-owns-the-state)
- [Imperative control with a ref](#imperative-control-with-a-ref)
- [Server-side rendering](#server-side-rendering)
- [Performance notes](#performance-notes)
- [API reference](#api-reference)

## What this is, and what it is not

**It is** the part of a data grid that is tedious to get right and identical in
every application: where the current page lives, what happens to it when a
filter changes, how a filter that depends on another filter stays consistent,
what the ref hands back to a parent.

**It is not** a table. There is no markup, no CSS, no virtualization, no cell
editing and no client-side sorting or filtering of your rows. The grid holds
`sort` and `order`; turning those into a sorted list is your data source's job,
usually a server. You render the `<table>`, or the cards, or whatever the design
calls for.

That split is the point. You get complete control of the DOM, and the state
logic stops being copied between projects.

## Installation

```bash
npm install @sovgut/datagrid
# or
yarn add @sovgut/datagrid
# or
pnpm add @sovgut/datagrid
```

`react` is the only peer dependency:

| Peer | Range |
| :--- | :--- |
| `react` | `^19.0.0` |

Nothing else to install. `zustand` backs the built-in store and is **bundled**,
so it never appears in your dependency tree and never has a say in your upgrade
schedule. It costs a few hundred bytes. The store it backs is created inside the
grid and never crosses a package boundary, so your own copy of `zustand`, if you
have one, is entirely unaffected.

## Core concepts

Three pieces, and that is the whole library.

1. **`<DataGrid>`** is a provider. You give it `columns`, `rows` and the total
   `size`, and it makes them available to everything inside it along with the
   query state and the actions that change it.
2. **`useDataGrid()`** is the consumer. Call it in any descendant to read the
   state (`page`, `limit`, `sort`, `order`, `filter`, `selected`), the data
   (`rows`, `columns`, `size`) and the actions (`setPagination`, `setSorting`,
   `setFilter`, `setSelected`, `setState`).
3. **Column definitions** describe the grid's shape: keys, labels, which columns
   sort, what their filter looks like, how a cell renders.

## Quick start

```tsx
import { DataGrid, useDataGrid, type DataGridColumn, type DataGridRow } from "@sovgut/datagrid";

// 1. Describe a row. Extending DataGridRow requires a unique `id`.
interface User extends DataGridRow {
  id: number;
  name: string;
  email: string;
}

// 2. Describe the columns.
const columns: DataGridColumn<User>[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name", sortable: true },
  { key: "email", label: "Email", sortable: true },
];

// 3. Render whatever you want. `useDataGrid<User>()` types `rows` as `User[]`.
function UserTable() {
  const { columns, rows, sort, order, setSorting } = useDataGrid<User>();

  function toggleSort(key: string) {
    setSorting(key, sort === key && order === "asc" ? "desc" : "asc");
  }

  return (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={String(column.key)}
              onClick={() => column.sortable && toggleSort(String(column.key))}
            >
              {column.label}
              {sort === column.key ? (order === "asc" ? " ▲" : " ▼") : ""}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.id}</td>
            <td>{row.name}</td>
            <td>{row.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 4. Wire it up. `onChange` is where you refetch.
export function Users({ users, total }: { users: User[]; total: number }) {
  return (
    <DataGrid
      columns={columns}
      rows={users}
      size={total}
      onChange={(query) => refetch(query)}
    >
      <UserTable />
    </DataGrid>
  );
}
```

## The state lifecycle

Worth reading once. Most surprises with this package are a surprise about
exactly one of the five points below.

**1. `query` seeds the store, once.** The `query` prop is read on the first
render and never again. Passing a new object later does nothing, and the type
forbids combining it with `store`. If the initial state arrives asynchronously,
either delay mounting the grid until you have it, remount it with a changed
`key`, or take ownership with `store`.

**2. Every action recomputes derived state before it commits.** `setPagination`,
`setSorting`, `setFilter`, `setSelected` and `setState` all build the next state,
run it through every column's `deriveState`, and only then write to the store.
A column can therefore correct or reject a change on its way in.

**3. A change of `sort` or `filter` resets the page to 1.** That is what
`resetPageOnQueryChange` controls, and it defaults to `true`. Being on page 7 of
a result set that no longer exists is almost never what a user wants.
`setPagination` never resets the page, whatever the setting.

**4. `onChange` and `onSelect` fire for different things.**

| Action | `onChange` | `onSelect` |
| :--- | :--- | :--- |
| `setPagination` | yes | no |
| `setSorting` | yes | no |
| `setFilter` | yes | no |
| `setSelected` | **no** | yes |
| `setState` | yes | yes |
| `ref.clear()` | yes | yes |

`setSelected` is deliberately outside `onChange`: ticking a checkbox should not
refetch the page. If you do want selection changes in your query callback, use
`setState`.

**5. There is one synchronization pass on mount.** If a column's `deriveState`
produces a state different from what the store holds, which is the normal case
when a column enforces a default filter, the grid writes the corrected state
back and calls `onChange` once. After that, handlers pre-compute the result and
the pass stays quiet.

## Columns

```tsx
const columns: DataGridColumn<User>[] = [
  {
    key: "status",
    label: "Status",
    sortable: true,
    visibility: DataGridColumnVisibility.Visible,
    multiple: true,
    metadata: { width: 120 },
    render: (row) => <StatusBadge value={row.status} />,
  },
];
```

`DataGridColumn` takes three type parameters, and only the first is usually
worth writing out:

```ts
DataGridColumn<TData, TMetadata, TFilterContext>
```

- **`TData`** is the row type.
- **`TMetadata`** types the `metadata` bag. Defaults to `Record<string, any>`.
  Set it when your rendering layer reads structured metadata, so a typo in a
  column definition is a compile error rather than an undefined at runtime.
- **`TFilterContext`** types the argument of a render-function filter. Defaults
  to `any`. Declaring it once on the array types `ctx` in every filter below,
  instead of annotating each one.

### Rendering a cell

`render` and `component` are mutually exclusive, and the type enforces that.
Supplying neither is fine: the column then exists only as a header, a sort
target or a filter, and your table body decides what to draw.

```tsx
// A function, for anything simple.
{ key: "total", label: "Total", render: (row, index, rows) => formatMoney(row.total) }

// A component, when the cell needs hooks or memoization of its own.
{ key: "actions", label: "", component: RowActions }
```

A `component` receives `DataGridComponentProps<TData>`:

```tsx
import type { DataGridComponentProps } from "@sovgut/datagrid";

function RowActions({ row, index, rows }: DataGridComponentProps<User>) {
  return <button onClick={() => remove(row.id)}>Delete</button>;
}
```

### Visibility

`DataGridColumnVisibility` has three values, and the distinction between two of
them matters:

| Value | Meaning |
| :--- | :--- |
| `Visible` | Shown. The default. |
| `Hidden` | Not shown. |
| `Restricted` | Shown only if something outside the grid says so, typically a permission check or a feature flag. |

`Restricted` is a marker, not a mechanism. The core does not know your
permission model; it carries the flag so your rendering layer can act on it.

## Filters

A column's `filter` is a UI declaration. The core never renders it and never
reads the user's input from it. It holds the resulting values in
`state.filter`, keyed by column key, and it is your rendering layer that puts
the element on screen and calls `setFilter`.

There are two forms.

**A plain element.** Your table clones it and injects the controlled props:

```tsx
{ key: "name", label: "Name", filter: <input type="text" placeholder="Filter by name" /> }
```

**A render function.** You build the element yourself, with no `cloneElement`:

```tsx
interface FilterContext {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  onBlur: () => void;
}

const columns: DataGridColumn<User, Record<string, unknown>, FilterContext>[] = [
  {
    key: "status",
    label: "Status",
    // `ctx` is FilterContext, inferred from the array type.
    filter: (ctx) => (
      <select value={ctx.value ?? ""} onChange={(e) => ctx.onChange(e.target.value || undefined)} onBlur={ctx.onBlur}>
        <option value="">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    ),
  },
];
```

### What a filter value may hold

Keep filter values **primitives, or arrays of primitives**. Two things depend
on it: the grid compares filters by value one level deep to decide whether the
state actually changed, and any URL synchronization has to be able to put the
value into a query string and read it back.

A column with `multiple: true` conventionally holds an array. Nothing enforces
the contract at the type level, but a `Date` or a nested object in a filter
value will compare by reference and will not survive a round trip through a URL.

## `deriveState` and `deriveProps`

`filterConfig` declares how a filter reacts to the rest of the filter state. The
two halves are handled in different layers, and knowing which is which saves an
afternoon.

| | Who calls it | When |
| :--- | :--- | :--- |
| `deriveState` | **this package** | inside every state transition, before the store is written |
| `deriveProps` | **your rendering layer** | during its own render, when it builds the filter element |

`deriveProps` is deliberately not implemented here. Only the layer that owns the
markup knows how to apply props to it: through `cloneElement`, a render prop, or
something else entirely. The core would have to guess.

```tsx
// A "method" filter whose options depend on the selected "currency".
const columns: DataGridColumn<Transaction>[] = [
  {
    key: "currency",
    label: "Currency",
    filter: <Select items={allCurrencies} />,
  },
  {
    key: "method",
    label: "Method",
    filter: <Select items={allMethods} />,
    filterConfig: {
      // Read by your table when it renders the filter.
      deriveProps: (props, state) => {
        const currency = state.filter.currency;

        if (!currency) {
          return { ...props, items: [], disabled: true };
        }

        return { ...props, items: allMethods.filter((m) => m.currency === currency) };
      },

      // Called by the grid on every state transition.
      deriveState: (context) => {
        const { currency, method } = context.filter;

        if (method && !allMethods.some((m) => m.id === method && m.currency === currency)) {
          context.filter.method = undefined;
        }

        return context;
      },
    },
  },
];
```

### The `deriveState` contract

- It runs **once per column that declares it, in column order**, and each
  function receives what the previous one returned. Order your columns so a
  dependency comes before its dependent.
- The context handed in is **a copy you may mutate**. The state object, its
  `filter` object and its `selected` array are all fresh. Assigning
  `context.filter.x`, deleting it and returning `context` is the intended style.
- **Values nested inside a filter entry are shared with the store by
  reference.** Replace them rather than editing them in place.
- Keep it a **fixed point**: running it on its own output must change nothing.
  A function that alternates between two states will not settle.
- To clear a filter, assign `undefined`. That is a real change and it does reach
  the store, unlike a `delete` followed by a value-identical object.

## Who owns the state

Two mutually exclusive answers, and the type enforces the choice: passing both
`query` and `store` is a compile error.

| | `query` | `store` |
| :--- | :--- | :--- |
| Owner | the grid | you |
| Counterpart in plain React | `defaultValue` | `value` |
| Use it when | you just need a starting page size, sort or filter | the state lives somewhere else: the URL, a route loader, a parent that shares it |
| Following along | pair it with `onChange` | you already have it |

The exclusivity is not a style rule. A grid given a `store` never reads the
internal one that `query` seeds, so passing both silently dropped the initial
state.

### Handing ownership over

Pass any object satisfying `DataGridReducer` as `store`, and the grid uses it
instead of its own state. This is the extension point: it is how
[`@sovgut/datagrid-react-router`](https://github.com/Sovgut/datagrid-react-router)
keeps table state in the URL, and it does not use zustand at all.

```tsx
import { DataGrid, type DataGridReducer, type DataGridState } from "@sovgut/datagrid";

function useUrlBackedStore(): DataGridReducer {
  const [params, setParams] = useSearchParams();

  return {
    page: Number(params.get("page") ?? 1),
    limit: Number(params.get("limit") ?? 10),
    sort: params.get("sort"),
    order: params.get("order") as DataGridState["order"],
    filter: readFilter(params),
    selected: params.getAll("selected"),

    setPagination: (page, limit) => setParams((p) => { /* ... */ return p; }),
    setSorting: (sort, order) => setParams((p) => { /* ... */ return p; }),
    setFilter: (filter) => setParams((p) => { /* ... */ return p; }),
    setSelected: (selected) => setParams((p) => { /* ... */ return p; }),
    setState: (state) => setParams((p) => { /* ... */ return p; }),
  };
}

<DataGrid columns={columns} rows={rows} size={total} store={useUrlBackedStore()}>
  <UserTable />
</DataGrid>
```

Two things to know:

- **The internal store is still created**, it is simply not read. That costs
  nothing you have to manage: `zustand` is bundled, not a peer dependency.
- **Memoize the object you return.** An external store rebuilt on every render
  gives the grid a new identity each time. Combined with a `deriveState` that is
  not a fixed point, that is the one way to make the synchronization pass loop.

## Imperative control with a ref

```tsx
import { useRef } from "react";
import { DataGrid, type DataGridRef } from "@sovgut/datagrid";

function Example() {
  const grid = useRef<DataGridRef>(null);

  return (
    <>
      <button onClick={() => grid.current?.clear()}>Reset</button>
      <button onClick={() => grid.current?.setPagination(2, grid.current.limit)}>Page 2</button>

      <DataGrid ref={grid} columns={columns} rows={rows} size={total}>
        <UserTable />
      </DataGrid>
    </>
  );
}
```

The ref exposes every state value and every action, plus `clear()`.

**`clear()` resets to the package defaults, not to your `query` prop.** A grid
started with `query={{ limit: 25 }}` goes back to `limit: 10`, not to 25. If you
want your own baseline, call `setState` with it instead. `clear()` still runs
the columns' `deriveState`, so a column that enforces a default filter keeps
enforcing it.

## Server-side rendering

The package touches no browser global. There is no `window`, no `document`, no
`structuredClone`, so importing and rendering it in Node works unchanged.

It is still a client package in the React Server Components sense, because it
uses state and context. Mark your own component with `"use client"`; the grid
does not carry the directive for you.

## Performance notes

**Memoize `columns`.** This is the one thing that matters. Column arrays are
usually written inline, which hands the grid a new array on every render, which
invalidates the derived state and re-renders every consumer of the context. Move
the array to module scope if it is static, or into a `useMemo` if it is not:

```tsx
const columns = useMemo(() => buildColumns(t, permissions), [t, permissions]);
```

Columns hold JSX elements and functions, so the grid cannot compare them
structurally on your behalf.

**`rows` and `size` deserve the same treatment** if you build them inline, for
the same reason.

## API reference

### `<DataGrid>` props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `columns` | `DataGridColumn<TData>[]` | **Required.** Column definitions. |
| `rows` | `TData[]` | **Required.** The rows for the current page. Each needs a unique `id`. |
| `size` | `number` | **Required.** Total number of items in the data source, for computing page count. |
| `query` | `Partial<DataGridState>` | Seeds the grid's own state, read on the first render only. Mutually exclusive with `store`. |
| `store` | `DataGridReducer` | Hands state ownership to you. Mutually exclusive with `query`. |
| `ref` | `Ref<DataGridRef>` | Imperative handle. |
| `onChange` | `(query: DataGridState) => void` | Fires when the query state changes. This is where you refetch. |
| `onSelect` | `(selected: string[]) => void` | Fires when the selection changes. |
| `resetPageOnQueryChange` | `boolean` | Reset to page 1 when sorting or filtering changes. Defaults to `true`. |
| `children` | `ReactNode` | Your table. |

### `DataGridColumn<TData, TMetadata, TFilterContext>`

| Property | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | **Required.** Unique key. Doubles as the filter key and, with URL synchronization, as the query parameter name. |
| `label` | `string` | **Required.** Header text. |
| `sortable` | `boolean` | Whether the column can be sorted. Defaults to `false`. |
| `render` | `(row: TData, index: number, rows: TData[]) => ReactNode` | Cell renderer. Mutually exclusive with `component`. |
| `component` | `ComponentType<DataGridComponentProps<TData>>` | Cell component. Mutually exclusive with `render`. |
| `filter` | `ColumnFilter<TFilterContext>` | A `ReactElement` or a `(ctx) => ReactElement`. |
| `filterConfig` | `ColumnFilterConfig` | `deriveProps` and `deriveState`. |
| `visibility` | `DataGridColumnVisibility` | Defaults to `Visible`. |
| `multiple` | `boolean` | Marks the filter as multi-valued. |
| `metadata` | `TMetadata` | Anything your rendering layer needs. |

### `DataGridState`

| Field | Type | Default |
| :--- | :--- | :--- |
| `page` | `number` | `1` |
| `limit` | `number` | `10` |
| `sort` | `string \| null` | `null` |
| `order` | `"asc" \| "desc" \| null` | `null` |
| `filter` | `Record<string, any>` | `{}` |
| `selected` | `string[]` | `[]` |

### `DataGridReducer`

`DataGridState` plus the actions. This is the shape the `store` prop expects.

| Action | Signature |
| :--- | :--- |
| `setPagination` | `(page: number, limit: number) => void` |
| `setSorting` | `(sort: string \| null \| undefined, order: "asc" \| "desc" \| null \| undefined) => void` |
| `setFilter` | `(filter: Record<string, any>) => void` |
| `setSelected` | `(selected: string[]) => void` |
| `setState` | `(state: DataGridState) => void` |

`setSorting` accepts `undefined` for either argument and normalizes it to
`null`, so a call site does not need a guard. The state itself only ever holds
`null`.

`setState` takes a complete state, not a partial one. The built-in store spreads
what it receives over the previous state, but that is a safety net rather than a
promise: an external store is free to replace outright, and
`@sovgut/datagrid-react-router` does.

### `DataGridRef<TData>`

`DataGridReducer`, plus the data the grid was given and `clear`.

| Member | Type |
| :--- | :--- |
| `columns` | `DataGridColumn<TData>[]` |
| `rows` | `TData[]` |
| `size` | `number` |
| `clear` | `() => void` |

Name your row type to have `rows` and `columns` typed:

```tsx
const grid = useRef<DataGridRef<User>>(null);
grid.current?.rows[0]?.name; // string | undefined
```

`TData` defaults to `any`, not to `DataGridRow`, and that is deliberate.
`DataGridColumn` is contravariant in its row type through `render` and
`component`, so a `DataGridRef<DataGridRow>` would not be assignable to a
`DataGridRef<User>`, and the unparameterized `useRef<DataGridRef>()` form would
stop compiling everywhere. The `any` default keeps both spellings
interchangeable and costs nothing to anyone who names their type.

### `ColumnFilterConfig`

| Property | Signature |
| :--- | :--- |
| `deriveProps` | `(props: Readonly<Record<string, any>>, context: DataGridState) => Record<string, any>` |
| `deriveState` | `(context: DataGridState) => DataGridState` |

### Constants

| Constant | Value |
| :--- | :--- |
| `DATAGRID_DEFAULT_PAGE` | `1` |
| `DATAGRID_DEFAULT_LIMIT` | `10` |
| `DATAGRID_DEFAULT_SORT` | `null` |
| `DATAGRID_DEFAULT_ORDER` | `null` |
| `DATAGRID_DEFAULT_FILTER` | `{}` |
| `DATAGRID_DEFAULT_SELECTED` | `[]` |
| `DATAGRID_SORT_ASC` | `"asc"` |
| `DATAGRID_SORT_DESC` | `"desc"` |
| `DATAGRID_RESET_PAGE_ON_QUERY_CHANGE` | `true` |

`DATAGRID_DEFAULT_FILTER` and `DATAGRID_DEFAULT_SELECTED` are single
module-level values shared by every grid on the page. Read them, spread them,
never mutate them in place.

### A note on `noPropertyAccessFromIndexSignature`

The package does not enable it, and neither should you on its account.
`context.filter.currency` stays the recommended style in `deriveState`. Filter
values are `any` behind an index signature, so the flag would cost every filter
access a bracket without buying any safety.

## Contributing

Issues and pull requests are welcome. Before opening one:

```bash
npm ci
npm run check      # Biome, rewrites files
npm run typecheck
npm test           # runs coverage, which is gated at 100%
npm run build
```

## License

[MIT](./LICENSE)
