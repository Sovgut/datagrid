# React DataGrid

A powerful, flexible, and headless data grid solution for React applications. It provides the logic, state management, and hooks needed to build highly custom and type-safe data grids.

> [\!NOTE]
> This package provides only the logic and state management for data grids. It is **headless** and **unstyled** by design. You bring your own components and styles to create the final UI, giving you complete control over the look and feel.

## Key Features

- 🏭 **Headless & Unstyled** - Provides the hooks and logic, you provide the UI components.
- 💪 **TypeScript Ready** - Fully typed API to ensure type safety and excellent editor support.
- 🪝 **Hook-Based API** - Use the `useDataGrid` hook to easily access state and actions anywhere in your table.
- 📄 **Pagination** - Built-in state for page and limit management.
- 📊 **Single-Column Sorting** - Simple and efficient single-column sorting logic.
- 🔍 **Filtering Support** - Define custom filter elements on a per-column basis.
- ⌛ **Debounce Support** - Column-level debounce configuration for filter operations.
- 🔌 **Flexible State Management** - Use the powerful internal Zustand store or provide your own external store.
- 🕹️ **Imperative API** - Use a `ref` to programmatically control the grid's state from a parent component.

---

## Installation

```bash
npm install @sovgut/datagrid
# or
yarn add @sovgut/datagrid
# or
pnpm add @sovgut/datagrid
```

---

## Core Concepts

This library is built around three core concepts:

1.  **`<DataGrid />` Component**: This is the context provider. You wrap your custom table components with `<DataGrid>` and pass it your `columns`, `rows`, and total `size`.
2.  **`useDataGrid()` Hook**: This is the consumer. Call this hook within any child of `<DataGrid>` to get access to the grid's state (`page`, `limit`, `sort`, `filter`), the processed data (`rows`, `columns`), and action dispatchers (`setPagination`, `setSorting`, `setFilter`).
3.  **Column Definitions**: You define your grid's structure by passing an array of `DataGridColumn` objects. Here you specify keys, labels, and behavior like sorting, filtering, and custom rendering.

---

## Basic Usage

Here's how to create a simple table with sorting. The `MyTableUI` component shows how to use the `useDataGrid` hook to build your own render logic.

```tsx
import { DataGrid, useDataGrid, type DataGridColumn, type DataGridRow } from "@sovgut/datagrid";
import type { FC } from "react";

// 1. Define your data structure
interface User extends DataGridRow {
  id: number;
  name: string;
  email: string;
}

// 2. Define your columns
const columns: DataGridColumn<User>[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name", sortable: true },
  { key: "email", label: "Email", sortable: true },
];

// 3. Create your data source
const rows: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
  // ... more users
];

// 4. Create your own UI component that consumes the grid state
const MyTableUI: FC = () => {
  // useDataGrid provides all the state and actions you need
  const { columns, rows, sort, order, setSorting } = useDataGrid<User>();

  const handleSort = (key: string) => {
    const newOrder = sort === key && order === "asc" ? "desc" : "asc";
    setSorting(key, newOrder);
  };

  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)} onClick={() => col.sortable && handleSort(String(col.key))}>
              {col.label}
              {sort === col.key ? (order === "asc" ? " ▲" : " ▼") : ""}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {columns.map((col) => (
              <td key={String(col.key)}>{row[col.key as keyof User]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// 5. Put it all together
export function SimpleExample() {
  return (
    <DataGrid
      columns={columns}
      rows={rows}
      size={rows.length}
      onChange={(state) => {
        console.log("Grid state changed:", state);
      }}
    >
      <MyTableUI />
    </DataGrid>
  );
}
```

---

## Advanced Usage

### Custom Rendering and Filtering

Provide a `render` function for custom cell content and a React element to the `filter` property. Use the `query` prop to set the initial state.

```tsx
import { DataGrid, type DataGridColumn, useDataGrid } from "@sovgut/datagrid";

const columns: DataGridColumn[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    // Render a custom element in the cell
    render: (row) => <strong>{row.name}</strong>,
    // Provide a JSX element to act as a filter
    filter: <input type="text" placeholder="Filter by name..." />,
    // Debounce filter input changes by 300ms
    debounce: 300,
  },
  {
    key: "status",
    label: "Status",
    filter: (
      <select>
        <option value="">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    ),
  },
];

function AdvancedExample() {
  return (
    <DataGrid
      columns={columns}
      rows={myRows}
      size={totalCount}
      // Use the `query` prop to set initial state
      query={{ limit: 25 }}
      // Reset to page 1 when filters or sorting change
      resetPageOnQueryChange={true}
    >
      <MyTableUI />
    </DataGrid>
  );
}
```

### Imperative Control with `ref`

You can control the grid from the outside by using a `ref`.

```tsx
import { useRef } from "react";
import { DataGrid, type DataGridRef } from "@sovgut/datagrid";

function RefExample() {
  const dataGridRef = useRef<DataGridRef>(null);

  const handleClearFilters = () => {
    // Access the grid's API via the ref
    dataGridRef.current?.clear();
  };

  const handleGoToPageTwo = () => {
    if (dataGridRef.current) {
      dataGridRef.current.setPagination(2, dataGridRef.current.limit);
    }
  };

  return (
    <div>
      <button onClick={handleClearFilters}>Clear All State</button>
      <button onClick={handleGoToPageTwo}>Go to Page 2</button>
      <DataGrid ref={dataGridRef} columns={columns} rows={rows} size={totalCount}>
        <MyTableUI />
      </DataGrid>
    </div>
  );
}
```

---

## API Reference

### DataGrid Props

| Prop                     | Type                             | Description                                                                                              |
| ------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `columns`                | `DataGridColumn<TData>[]`        | **Required.** An array of column definition objects.                                                     |
| `rows`                   | `DataGridRow[]`                  | **Required.** The array of data to display. Each object must have a unique `id`.                         |
| `size`                   | `number`                         | **Required.** The total number of items available, used for pagination.                                  |
| `query`                  | `Partial<DataGridState>`         | An object to set the initial state of the grid (page, limit, sort, etc.).                                |
| `store`                  | `DataGridReducer`                | An external store to control the grid's state completely.                                                |
| `ref`                    | `Ref<DataGridRef>`               | A ref to imperatively control the grid's state.                                                          |
| `onChange`               | `(state: DataGridState) => void` | A callback fired whenever the grid's state changes.                                                      |
| `onSelect`               | `(selected: string[]) => void`   | A callback fired when row selection changes.                                                             |
| `resetPageOnQueryChange` | `boolean`                        | If `true`, resets to page 1 when sorting or filtering changes. Defaults to `true`.                       |
| `loading`                | `boolean`                        | A flag to indicate a primary data fetch is in progress. Passed down through `useDataGrid`.               |
| `pending`                | `boolean`                        | A flag to indicate a background update (like sorting) is in progress. Passed down through `useDataGrid`. |

### DataGridColumn Properties

| Property    | Type                                           | Description                                                                       |
| ----------- | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| `key`       | `keyof TData \| string`                        | **Required.** A unique key, usually matching a property in your data row object.  |
| `label`     | `string`                                       | **Required.** The text to display in the column header.                           |
| `sortable`  | `boolean`                                      | If `true`, enables sorting for this column.                                       |
| `render`    | `(row: TData, ...) => ReactNode`               | A function to render custom content for a cell.                                   |
| `component` | `ComponentType<DataGridComponentProps<TData>>` | A React component to render for the cell. Alternative to `render`.                |
| `filter`    | `ReactElement`                                 | A React element (e.g., `<input>`, `<select>`) to use as a filter for this column. |
| `debounce`  | `number`                                       | Debounce time in milliseconds for filter changes.                                 |
| `multiple`  | `boolean`                                      | Indicates if the filter for this column can accept multiple values.               |
| `metadata`  | `Record<string, any>`                          | A place to store any other custom data you need for the column.                   |

---

## License

MIT

## Contributing

Contributions are welcome\! Please feel free to submit a Pull Request.
