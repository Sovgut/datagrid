import { act, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { useStore } from "zustand";

import { DATAGRID_DEFAULT_LIMIT, DATAGRID_DEFAULT_PAGE } from "./constants.ts";
import { DataGrid } from "./DataGrid.tsx";
import { createDataGridStore, type DataGridReducer, type DataGridState } from "./store/store.ts";
import type { DataGridColumn, DataGridRef, DataGridRow } from "./types.ts";

interface Row extends DataGridRow {
  id: number;
}

const rows: Row[] = [{ id: 1 }];

describe("deriveState", () => {
  it("syncs the store on mount and reports the change exactly once", () => {
    const onChange = vi.fn();
    const ref = createRef<DataGridRef>();
    const columns: DataGridColumn<Row>[] = [
      {
        key: "currency",
        label: "Currency",
        filterConfig: {
          deriveState: (context) => {
            context.filter.currency = context.filter.currency ?? "USD";

            return context;
          },
        },
      },
    ];

    render(<DataGrid<Row> ref={ref} columns={columns} rows={rows} size={1} onChange={onChange} />);

    expect(ref.current?.filter).toEqual({ currency: "USD" });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("chains column by column, each one seeing the previous result", () => {
    const ref = createRef<DataGridRef>();
    const columns: DataGridColumn<Row>[] = [
      {
        key: "first",
        label: "First",
        filterConfig: {
          deriveState: (context) => {
            context.filter.trail = "a";

            return context;
          },
        },
      },
      { key: "plain", label: "Plain" },
      {
        key: "second",
        label: "Second",
        filterConfig: {
          deriveState: (context) => {
            context.filter.trail = `${context.filter.trail}b`;

            return context;
          },
        },
      },
    ];

    render(<DataGrid<Row> ref={ref} columns={columns} rows={rows} size={1} />);

    expect(ref.current?.filter).toEqual({ trail: "ab" });
  });

  it("invalidates a dependent filter by assigning undefined, and that reaches the store", () => {
    const ref = createRef<DataGridRef>();
    const columns: DataGridColumn<Row>[] = [
      { key: "currency", label: "Currency" },
      {
        key: "method",
        label: "Method",
        filterConfig: {
          deriveState: (context) => {
            if (context.filter.method && !context.filter.currency) {
              context.filter.method = undefined;
            }

            return context;
          },
        },
      },
    ];

    render(<DataGrid<Row> ref={ref} columns={columns} rows={rows} size={1} />);

    act(() => ref.current?.setFilter({ currency: "USD", method: 1 }));
    expect(ref.current?.filter).toEqual({ currency: "USD", method: 1 });

    act(() => ref.current?.setFilter({ method: 1 }));
    expect(ref.current?.filter).toEqual({ method: undefined });
  });

  it("does not let a mutating deriveState reach the object held by the store", () => {
    const seen: DataGridState["filter"][] = [];
    const ref = createRef<DataGridRef>();
    const columns: DataGridColumn<Row>[] = [
      {
        key: "status",
        label: "Status",
        filterConfig: {
          deriveState: (context) => {
            seen.push(context.filter);
            context.filter.touched = true;

            return context;
          },
        },
      },
    ];

    render(<DataGrid<Row> ref={ref} columns={columns} rows={rows} size={1} />);

    const original = { status: "active" };
    act(() => ref.current?.setFilter(original));

    expect(original).toEqual({ status: "active" });
    expect(seen.every((filter) => filter !== original)).toBe(true);
  });
});

describe("onSelect", () => {
  it("reports what reached the store, not the raw argument", () => {
    const onSelect = vi.fn();
    const ref = createRef<DataGridRef>();
    const columns: DataGridColumn<Row>[] = [
      {
        key: "pinned",
        label: "Pinned",
        filterConfig: {
          deriveState: (context) => {
            // A column that refuses to let the pinned row be deselected.
            if (!context.selected.includes("pinned")) {
              context.selected = [...context.selected, "pinned"];
            }

            return context;
          },
        },
      },
    ];

    render(<DataGrid<Row> ref={ref} columns={columns} rows={rows} size={1} onSelect={onSelect} />);

    onSelect.mockClear();
    act(() => ref.current?.setSelected(["a"]));

    expect(onSelect).toHaveBeenCalledWith(["a", "pinned"]);
    expect(ref.current?.selected).toEqual(["a", "pinned"]);
  });
});

describe("ref data", () => {
  it("exposes columns, rows and size", () => {
    const ref = createRef<DataGridRef>();
    const columns: DataGridColumn<Row>[] = [{ key: "id", label: "ID" }];

    render(<DataGrid<Row> ref={ref} columns={columns} rows={rows} size={7} />);

    expect(ref.current?.size).toBe(7);
    expect(ref.current?.rows).toEqual(rows);
    expect(ref.current?.columns).toHaveLength(1);
  });

  it("types rows and columns when the row type is named", () => {
    // Both spellings must keep working: the bare form above, and this one.
    // The type parameter defaults to `ExpectedAny` precisely so that neither
    // rejects the other, `DataGridColumn` being contravariant in its row type.
    const ref = createRef<DataGridRef<Row>>();
    const columns: DataGridColumn<Row>[] = [{ key: "id", label: "ID" }];

    render(<DataGrid<Row> ref={ref} columns={columns} rows={rows} size={1} />);

    const id: number | undefined = ref.current?.rows[0]?.id;
    const key: string | undefined = ref.current?.columns[0]?.key;

    expect(id).toBe(1);
    expect(key).toBe("id");
  });
});

describe("setState through the ref", () => {
  it("applies the whole state, runs deriveState over it and fires both callbacks", () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    const ref = createRef<DataGridRef>();
    const columns: DataGridColumn<Row>[] = [
      {
        key: "stamp",
        label: "Stamp",
        filterConfig: {
          deriveState: (context) => {
            context.filter.stamp = "applied";

            return context;
          },
        },
      },
    ];

    render(<DataGrid<Row> ref={ref} columns={columns} rows={rows} size={1} onChange={onChange} onSelect={onSelect} />);

    onChange.mockClear();
    onSelect.mockClear();

    act(() =>
      ref.current?.setState({
        page: 4,
        limit: 50,
        sort: "id",
        order: "desc",
        filter: { other: 1 },
        selected: ["x"],
      })
    );

    expect(ref.current).toMatchObject({
      page: 4,
      limit: 50,
      sort: "id",
      order: "desc",
      selected: ["x"],
    });
    // deriveState ran over what was handed in, rather than being skipped.
    expect(ref.current?.filter).toEqual({ other: 1, stamp: "applied" });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(["x"]);
  });

  it("does not reset the page, unlike setSorting and setFilter", () => {
    const ref = createRef<DataGridRef>();

    render(<DataGrid<Row> ref={ref} columns={[]} rows={rows} size={1} />);

    act(() => ref.current?.setState({ page: 6, limit: 10, sort: "id", order: "asc", filter: { a: 1 }, selected: [] }));

    expect(ref.current?.page).toBe(6);
  });
});

describe("nullish setter arguments", () => {
  it("normalizes them to the package defaults", () => {
    const ref = createRef<DataGridRef>();

    render(<DataGrid<Row> ref={ref} columns={[]} rows={rows} size={1} query={{ sort: "id", order: "asc" }} />);

    act(() => ref.current?.setSorting(undefined, undefined));
    expect(ref.current).toMatchObject({ sort: null, order: null });

    act(() => ref.current?.setFilter({ a: 1 }));
    act(() => ref.current?.setFilter(undefined as never));
    expect(ref.current?.filter).toEqual({});

    act(() => ref.current?.setSelected(["a"]));
    act(() => ref.current?.setSelected(undefined as never));
    expect(ref.current?.selected).toEqual([]);
  });
});

describe("clear", () => {
  it("still applies the columns' deriveState", () => {
    const ref = createRef<DataGridRef>();
    const columns: DataGridColumn<Row>[] = [
      {
        key: "scope",
        label: "Scope",
        filterConfig: {
          // A column that enforces a mandatory filter. `clear` must not be a
          // way to escape it, or the grid would sit in a state the column
          // considers invalid.
          deriveState: (context) => {
            context.filter.scope = context.filter.scope ?? "mine";

            return context;
          },
        },
      },
    ];

    render(<DataGrid<Row> ref={ref} columns={columns} rows={rows} size={1} />);

    act(() => ref.current?.setFilter({ scope: "all" }));
    expect(ref.current?.filter).toEqual({ scope: "all" });

    act(() => ref.current?.clear());
    expect(ref.current?.filter).toEqual({ scope: "mine" });
  });

  it("routes through an external store rather than the internal one", () => {
    const external = createDataGridStore({ page: 5, limit: 25 });
    const ref = createRef<DataGridRef>();

    function Grid() {
      const state = useStore(external, (s) => s);

      return <DataGrid<Row> ref={ref} columns={[]} rows={rows} size={1} store={state} />;
    }

    render(<Grid />);
    act(() => ref.current?.clear());

    expect(external.getState()).toMatchObject({
      page: DATAGRID_DEFAULT_PAGE,
      limit: DATAGRID_DEFAULT_LIMIT,
      filter: {},
      selected: [],
    });
  });
});

describe("a malformed external store", () => {
  it("falls back to the package defaults for every field it fails to supply", () => {
    const ref = createRef<DataGridRef>();
    // The `store` prop is the documented extension point, and what arrives
    // through it is consumer code the type system does not police. A store that
    // omits fields must degrade to the defaults, not crash the grid.
    const partial = {
      sort: null,
      order: null,
      setPagination: () => undefined,
      setSorting: () => undefined,
      setFilter: () => undefined,
      setSelected: () => undefined,
      setState: () => undefined,
    } as unknown as DataGridReducer;

    expect(() => render(<DataGrid<Row> ref={ref} columns={[]} rows={rows} size={1} store={partial} />)).not.toThrow();

    expect(ref.current).toMatchObject({
      page: DATAGRID_DEFAULT_PAGE,
      limit: DATAGRID_DEFAULT_LIMIT,
      filter: {},
      selected: [],
    });
  });
});

describe("the mount synchronization pass", () => {
  it.each([
    ["page", { page: 3 }, "page"],
    ["limit", { limit: 99 }, "limit"],
    ["sort", { sort: "id" }, "sort"],
    ["order", { order: "desc" as const }, "order"],
  ])("detects a deriveState that changes %s", (_label, patch, field) => {
    const onChange = vi.fn();
    const ref = createRef<DataGridRef>();
    const columns: DataGridColumn<Row>[] = [
      {
        key: "k",
        label: "K",
        filterConfig: {
          deriveState: (context) => Object.assign(context, patch),
        },
      },
    ];

    render(<DataGrid<Row> ref={ref} columns={columns} rows={rows} size={1} onChange={onChange} />);

    expect(ref.current?.[field as "page"]).toBe(Object.values(patch)[0]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("stays quiet when no column changes anything", () => {
    const onChange = vi.fn();
    const columns: DataGridColumn<Row>[] = [
      { key: "a", label: "A" },
      { key: "b", label: "B", filterConfig: { deriveState: (context) => context } },
    ];

    render(<DataGrid<Row> columns={columns} rows={rows} size={1} onChange={onChange} />);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("reports once even when several columns each change something", () => {
    const onChange = vi.fn();
    const ref = createRef<DataGridRef>();
    const columns: DataGridColumn<Row>[] = [
      { key: "a", label: "A", filterConfig: { deriveState: (c) => Object.assign(c, { page: 2 }) } },
      { key: "b", label: "B", filterConfig: { deriveState: (c) => Object.assign(c, { limit: 40 }) } },
      { key: "c", label: "C", filterConfig: { deriveState: (c) => Object.assign(c, { sort: "id" }) } },
    ];

    render(<DataGrid<Row> ref={ref} columns={columns} rows={rows} size={1} onChange={onChange} />);

    expect(ref.current).toMatchObject({ page: 2, limit: 40, sort: "id" });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("external store", () => {
  it("routes every setter through the provided reducer and leaves the internal store alone", () => {
    const internal = createDataGridStore(null);
    const external = createDataGridStore({ limit: 25 });
    const reducer: DataGridReducer = {
      ...external.getState(),
      setPagination: external.getState().setPagination,
      setSorting: external.getState().setSorting,
      setFilter: external.getState().setFilter,
      setSelected: external.getState().setSelected,
      setState: external.getState().setState,
    };
    const ref = createRef<DataGridRef>();

    render(<DataGrid<Row> ref={ref} columns={[]} rows={rows} size={1} store={reducer} />);

    expect(ref.current?.limit).toBe(25);

    act(() => ref.current?.setSorting("name", "asc"));

    expect(external.getState().sort).toBe("name");
    expect(internal.getState().sort).toBe(null);
  });
});
