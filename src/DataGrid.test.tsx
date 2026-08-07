import { act, render, renderHook, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  DATAGRID_DEFAULT_LIMIT,
  DATAGRID_DEFAULT_ORDER,
  DATAGRID_DEFAULT_PAGE,
  DATAGRID_DEFAULT_SORT,
} from "./constants.ts";
import { DataGrid } from "./DataGrid.tsx";
import { useDataGrid } from "./internal/hook.ts";
import type { DataGridColumn, DataGridRef, DataGridRow } from "./types.ts";

/**
 * Declared as an `interface`, deliberately.
 *
 * An interface does not get an implicit index signature in TypeScript, so this
 * declaration only satisfies the `DataGridRow` constraint while the index
 * signature on `DataGridRow` stays `any`. If someone narrows it to `unknown`,
 * this file stops compiling, which is the whole point: every grid mounted with
 * an interface-typed row in every consuming application would break the same
 * way.
 */
interface User extends DataGridRow {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: "Ada" },
  { id: 2, name: "Grace" },
];

const columns: DataGridColumn<User>[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name", sortable: true },
];

function Probe() {
  const grid = useDataGrid<User>();

  return (
    <div>
      <span data-testid="page">{grid.page}</span>
      <span data-testid="limit">{grid.limit}</span>
      <span data-testid="sort">{String(grid.sort)}</span>
      <span data-testid="size">{grid.size}</span>
      <span data-testid="names">{grid.rows.map((row) => row.name).join(",")}</span>
      <span data-testid="columns">{grid.columns.map((column) => column.label).join(",")}</span>
    </div>
  );
}

function text(id: string) {
  return screen.getByTestId(id).textContent;
}

describe("useDataGrid", () => {
  it("throws when used outside of a DataGrid", () => {
    expect(() => renderHook(() => useDataGrid())).toThrow(ReferenceError);
  });

  it("exposes rows, columns and size to descendants", () => {
    render(
      <DataGrid<User> columns={columns} rows={users} size={42}>
        <Probe />
      </DataGrid>
    );

    expect(text("names")).toBe("Ada,Grace");
    expect(text("columns")).toBe("ID,Name");
    expect(text("size")).toBe("42");
  });
});

describe("DataGrid", () => {
  it("seeds its state from the query prop", () => {
    render(
      <DataGrid<User> columns={columns} rows={users} size={2} query={{ limit: 25, page: 3, sort: "name" }}>
        <Probe />
      </DataGrid>
    );

    expect(text("limit")).toBe("25");
    expect(text("page")).toBe("3");
    expect(text("sort")).toBe("name");
  });

  it("ignores a changed query prop after the first render", () => {
    const { rerender } = render(
      <DataGrid<User> columns={columns} rows={users} size={2} query={{ limit: 25 }}>
        <Probe />
      </DataGrid>
    );

    expect(text("limit")).toBe("25");

    rerender(
      <DataGrid<User> columns={columns} rows={users} size={2} query={{ limit: 99 }}>
        <Probe />
      </DataGrid>
    );

    // Documented: `query` seeds the store once. Anything else would fight with
    // the user's own interactions on every parent render.
    expect(text("limit")).toBe("25");
  });

  it("passes new rows and size through on rerender", () => {
    const { rerender } = render(
      <DataGrid<User> columns={columns} rows={users} size={2}>
        <Probe />
      </DataGrid>
    );

    rerender(
      <DataGrid<User> columns={columns} rows={[{ id: 3, name: "Alan", email: "" }]} size={99}>
        <Probe />
      </DataGrid>
    );

    expect(text("names")).toBe("Alan");
    expect(text("size")).toBe("99");
  });

  it("works without any callbacks attached", () => {
    const ref = createRef<DataGridRef>();

    render(<DataGrid<User> ref={ref} columns={columns} rows={users} size={2} />);

    expect(() => {
      act(() => ref.current?.setSorting("name", "asc"));
      act(() => ref.current?.setSelected(["1"]));
      act(() => ref.current?.setState({ page: 2, limit: 10, sort: null, order: null, filter: {}, selected: [] }));
      act(() => ref.current?.clear());
    }).not.toThrow();
  });

  it("keeps two grids on the page independent", () => {
    const first = createRef<DataGridRef>();
    const second = createRef<DataGridRef>();

    render(
      <>
        <DataGrid<User> ref={first} columns={columns} rows={users} size={2} />
        <DataGrid<User> ref={second} columns={columns} rows={users} size={2} />
      </>
    );

    act(() => first.current?.setFilter({ status: "active" }));

    expect(first.current?.filter).toEqual({ status: "active" });
    expect(second.current?.filter).toEqual({});
  });
});

describe("resetPageOnQueryChange", () => {
  it("sends sorting and filtering back to the first page by default", () => {
    const ref = createRef<DataGridRef>();

    render(<DataGrid<User> ref={ref} columns={columns} rows={users} size={2} query={{ page: 4 }} />);

    act(() => ref.current?.setSorting("name", "asc"));
    expect(ref.current?.page).toBe(DATAGRID_DEFAULT_PAGE);

    act(() => ref.current?.setPagination(7, DATAGRID_DEFAULT_LIMIT));
    act(() => ref.current?.setFilter({ status: "active" }));
    expect(ref.current?.page).toBe(DATAGRID_DEFAULT_PAGE);
  });

  it("keeps the current page when switched off", () => {
    const ref = createRef<DataGridRef>();

    render(
      <DataGrid<User>
        ref={ref}
        columns={columns}
        rows={users}
        size={2}
        query={{ page: 4 }}
        resetPageOnQueryChange={false}
      />
    );

    act(() => ref.current?.setSorting("name", "asc"));
    expect(ref.current?.page).toBe(4);

    act(() => ref.current?.setFilter({ status: "active" }));
    expect(ref.current?.page).toBe(4);
  });

  it("never resets the page on setPagination itself", () => {
    const ref = createRef<DataGridRef>();

    render(<DataGrid<User> ref={ref} columns={columns} rows={users} size={2} />);

    act(() => ref.current?.setPagination(9, 100));

    expect(ref.current?.page).toBe(9);
    expect(ref.current?.limit).toBe(100);
  });
});

describe("callbacks", () => {
  it("fires onSelect but not onChange when the selection changes", () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    const ref = createRef<DataGridRef>();

    render(
      <DataGrid<User> ref={ref} columns={columns} rows={users} size={2} onChange={onChange} onSelect={onSelect} />
    );

    onChange.mockClear();
    act(() => ref.current?.setSelected(["1"]));

    expect(onSelect).toHaveBeenCalledWith(["1"]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("fires onChange when the query changes", () => {
    const onChange = vi.fn();
    const ref = createRef<DataGridRef>();

    render(<DataGrid<User> ref={ref} columns={columns} rows={users} size={2} onChange={onChange} />);

    onChange.mockClear();
    act(() => ref.current?.setSorting("name", "desc"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sort: "name", order: "desc" }));
  });
});

describe("ref.clear", () => {
  it("resets to the package defaults rather than to the query prop, and fires both callbacks", () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    const ref = createRef<DataGridRef>();

    render(
      <DataGrid<User>
        ref={ref}
        columns={columns}
        rows={users}
        size={2}
        query={{ limit: 25, page: 3 }}
        onChange={onChange}
        onSelect={onSelect}
      />
    );

    act(() => ref.current?.setFilter({ status: "active" }));
    act(() => ref.current?.setSelected(["1"]));

    onChange.mockClear();
    onSelect.mockClear();
    act(() => ref.current?.clear());

    expect(ref.current).toMatchObject({
      page: DATAGRID_DEFAULT_PAGE,
      limit: DATAGRID_DEFAULT_LIMIT,
      sort: DATAGRID_DEFAULT_SORT,
      order: DATAGRID_DEFAULT_ORDER,
      filter: {},
      selected: [],
    });
    expect(ref.current?.limit).not.toBe(25);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
