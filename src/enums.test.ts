// @vitest-environment node

import { describe, expect, it } from "vitest";

import { DataGridColumnVisibility } from "./enums.ts";

describe("DataGridColumnVisibility", () => {
  it("exposes the three visibility states as their own names", () => {
    expect(DataGridColumnVisibility).toEqual({
      Visible: "Visible",
      Restricted: "Restricted",
      Hidden: "Hidden",
    });
  });

  it("is usable as a value and as a type", () => {
    const visibility: DataGridColumnVisibility = DataGridColumnVisibility.Restricted;

    expect(visibility).toBe("Restricted");
  });
});
