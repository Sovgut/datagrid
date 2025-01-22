# React DataGrid

A powerful, flexible, and type-safe data grid component for React applications with built-in support for pagination, sorting, and filtering.

> [!NOTE]
> This package provides only the logic and state management for data grids. It does not include any styling or rendering components. It's designed to be a foundation for building your own table UI components.

## Key Features

- 🔍 **Built-in Filtering** - Flexible filtering system with support for multiple filter types
- 📊 **Single Column Sorting** - Simple and efficient single-column sorting
- 📄 **Pagination** - Built-in pagination with customizable page sizes
- 🔄 **State Management** - Internal state management with external state support
- 🔌 **Pluggable State** - Easy to override state management using SharedDataGridContext
- ⌛ **Debounce Support** - Column-level debounce configuration for filter operations
- 🔌 **Extensible** - Easy to extend and customize with your own components
- 💪 **TypeScript Ready** - Full TypeScript support with comprehensive type definitions
- 🧹 **Auto-cleaning** - Automatic cleanup of empty/null values from filters

## Installation

```bash
npm install @sovgut/datagrid
# or
yarn add @sovgut/datagrid
# or
pnpm add @sovgut/datagrid
```

## Basic Usage

### Simple DataGrid with Sorting

```tsx
import { DataGrid } from "@sovgut/datagrid";

function SimpleExample() {
  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
  ];

  const rows = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
  ];

  return (
    <DataGrid
      columns={columns}
      rows={rows}
      size={rows.length}
      onChange={(details) => {
        console.log("Active sort column:", details.sort);
        console.log("Sort direction:", details.order);
      }}
    >
      <YourTableContent />
    </DataGrid>
  );
}
```

### With Shared State Management

```tsx
import { DataGrid, useSharedDataGrid } from "@sovgut/datagrid";

function ExternalStateExample() {
  const [state, dispatch] = useSharedDataGrid();

  useEffect(() => {
    dispatch({ page: 2 })
  }, [])

  return (
    <DataGrid
      columns={columns}
      rows={rows}
      size={totalCount}
      context={[state, dispatch]}
    >
      <YourTableContent />
    </DataGrid>
  );
}
```

### With Custom Column Rendering and Filtering

```tsx
import { DataGrid, DataGridColumn } from "@sovgut/datagrid";

function AdvancedExample() {
  const columns: DataGridColumn[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row) => <strong>{row.name}</strong>,
      filter: <input type="text" placeholder="Filter by name..." />,
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
      multiple: true,
    },
  ];

  return (
    <DataGrid
      columns={columns}
      rows={rows}
      size={totalCount}
      initialLimit={25}
      resetPageOnQueryChange={true}
    >
      <YourTableContent />
    </DataGrid>
  );
}
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
