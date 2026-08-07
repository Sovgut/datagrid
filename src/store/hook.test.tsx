import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataGridStoreContext } from "./context.ts";
import { useDataGridStore } from "./hook.ts";
import { createDataGridStore } from "./store.ts";

describe("useDataGridStore", () => {
  it("throws when there is no store above it", () => {
    expect(() => renderHook(() => useDataGridStore((store) => store.page))).toThrow(ReferenceError);
  });

  it("selects a slice of the store", () => {
    const store = createDataGridStore({ page: 3, limit: 25 });
    const { result } = renderHook(() => useDataGridStore((state) => state.limit), {
      wrapper: ({ children }) => (
        <DataGridStoreContext.Provider value={store}>{children}</DataGridStoreContext.Provider>
      ),
    });

    expect(result.current).toBe(25);
  });
});
