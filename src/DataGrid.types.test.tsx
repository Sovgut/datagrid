// @vitest-environment node

import { describe, expect, it } from "vitest";

import { DataGrid } from "./DataGrid.tsx";
import type { DataGridReducer } from "./store/store.ts";
import type { DataGridColumn, DataGridRow } from "./types.ts";

/**
 * A compile-time test. Nothing here runs anything meaningful: the assertions
 * are the type annotations, and the file failing to compile is the failure.
 *
 * `npm run typecheck` is what enforces it, since `tsconfig.test.json` covers
 * this file. Vitest transpiles without checking types, so a runtime-only run
 * would not catch a regression on its own.
 */

interface User extends DataGridRow {
  id: number;
  name: string;
}

const store = {} as DataGridReducer;
const rows: User[] = [];
const columns: DataGridColumn<User>[] = [];

describe("query and store are mutually exclusive", () => {
  it("accepts either strategy alone, or neither", () => {
    const uncontrolled = <DataGrid<User> columns={columns} rows={rows} size={1} query={{ limit: 25 }} />;
    const controlled = <DataGrid<User> columns={columns} rows={rows} size={1} store={store} />;
    const neither = <DataGrid<User> columns={columns} rows={rows} size={1} />;

    expect([uncontrolled, controlled, neither]).toHaveLength(3);
  });

  it("rejects both at once", () => {
    // A grid given a `store` never reads the internal one that `query` seeds,
    // so passing both used to drop the initial state in silence. If this stops
    // being an error the suppression below goes unused and typecheck fails.
    // @ts-expect-error - query and store are mutually exclusive
    const both = <DataGrid<User> columns={columns} rows={rows} size={1} query={{ limit: 25 }} store={store} />;

    expect(both).toBeDefined();
  });
});
