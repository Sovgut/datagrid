---
# Unconditional: everything here ships. A change that looks internal can break a
# consumer's build, and nothing in this repository's own checks would notice.
---

# The public API

What this package promises, and what breaking a promise costs.

The surface is exactly `src/main.ts`. If a symbol is not re-exported there it is
internal: rename it, reshape it, delete it. If it is, it is a semver commitment.

## What is exported

| Kind | Symbols |
| :--- | :--- |
| Components | `DataGrid` |
| Hooks | `useDataGrid` |
| Enums | `DataGridColumnVisibility` (const object + type) |
| Constants | `DATAGRID_DEFAULT_PAGE`, `DATAGRID_DEFAULT_LIMIT`, `DATAGRID_DEFAULT_SORT`, `DATAGRID_DEFAULT_ORDER`, `DATAGRID_DEFAULT_FILTER`, `DATAGRID_DEFAULT_SELECTED`, `DATAGRID_SORT_ASC`, `DATAGRID_SORT_DESC`, `DATAGRID_RESET_PAGE_ON_QUERY_CHANGE` |
| Types | `DataGridProps`, `DataSourceProps`, `DataGridResetProps`, `DataGridState`, `DataGridReducer`, `DataGridColumn`, `DataGridRow`, `DataGridComponentProps`, `DataGridRef`, `ColumnFilter`, `ColumnFilterConfig`, `Nullable` |

`DataSource` itself is not exported, but its props type is, because
`DataGridProps` is built from it.

## What counts as breaking

Obvious: removing an export, renaming one, adding a required prop, narrowing a
parameter type, widening a return type.

Less obvious, and each of these has a consumer-visible failure mode:

- **Widening a public type's declared shape** so that a consumer's own
  implementation of it no longer satisfies it. `DataGridReducer` is implemented
  by external stores, so adding a method to it breaks every one of them.
- **Changing what `setState` does with a partial object.** The contract is a
  *complete* state. The built-in store spreads over the previous state as a
  safety net for untyped callers, but an external store is free to replace
  outright, and consumers rely on that freedom.
- **Renaming a `DataGridColumn.key` convention.** `key` is simultaneously the
  filter key, the query parameter a URL-syncing layer uses, and the identifier a
  saved column layout is stored under. It is a contract, not a caption.
- **Changing a `DATAGRID_DEFAULT_*` value.** Consumers seed state with these and
  compare against them.
- **Changing the type annotation on a `DATAGRID_DEFAULT_*` constant.** The
  annotations are load-bearing, not decoration: without them
  `DATAGRID_DEFAULT_SORT` emits as `declare const ...: null`, and a consumer
  writing `useState(DATAGRID_DEFAULT_SORT)` gets a `null`-only slot that can
  never hold a column key. `DATAGRID_DEFAULT_SELECTED` would emit as `never[]`.

`DATAGRID_DEFAULT_FILTER` and `DATAGRID_DEFAULT_SELECTED` are single
module-level values shared by every grid on the page. They are read and spread,
never mutated in place, and the same holds for any new one.

## The declarations are part of the package

`dist/` contains `datagrid.js` **and** the `.d.ts` tree emitted by
`vite-plugin-dts`. A consumer typechecking with `skipLibCheck: false` compiles
those files, so an import inside one of them is an import they have to resolve.

**zustand must not be nameable from any emitted declaration.** It is bundled
into the JavaScript precisely so consumers never install it, and a type import
undoes that: the module cannot be resolved and their build fails, while this
repository's own checks stay green.

The trap is `isolatedDeclarations`. It requires every exported declaration to
carry an explicit return type, and for the store factory the obvious annotation
is zustand's `StoreApi<DataGridReducer>`. Naming it puts
`import { StoreApi } from "zustand"` at the top of `store.d.ts`, and since the
entry point re-exports `DataGridReducer` and `DataGridState` from that module,
the import lands on the public type path.

`DataGridStore` exists for this reason: it is declared structurally, as the part
of `StoreApi` this package actually uses, and it stays structurally compatible
with it. Annotate with `DataGridStore`, never with a zustand type.

Three separate things must all stay true, and each fails differently:

| Requirement | Failure if broken |
| :--- | :--- |
| `zustand` in `devDependencies`, not `dependencies` | Consumers download a copy nothing imports |
| `zustand` absent from `build.rolldownOptions.external` | The bundle imports a module the consumer does not have |
| No zustand type nameable from a `.d.ts` | Consumers without `skipLibCheck` cannot compile |

## Verifying before a release

`npm run build` proves the bundle builds. It does not prove the package works
when installed. When a change touches the manifest, the build config, the entry
point or an exported type, verify against a real consumer:

```bash
npm pack                 # then install the tarball into a consuming project
npm ls zustand --omit=dev  # must be empty
```

Compare **all of `dist/`** between the previous build and the new one, not just
the bundle. A check that compares only `datagrid.js` reports "byte-identical"
while the declarations change underneath it.

## The README is part of the API

`README.md` is the package's public documentation and the only one most
consumers read. Updating it is part of the change that makes it false, not a
follow-up:

- an exported symbol added, renamed or removed;
- a default value, a prop, or a type's shape changed;
- a documented constraint that stops being true (the peer dependency list, the
  SSR claim, `query` / `store` exclusivity, the filter-value contract).

The API reference tables near the end of the README enumerate props, state
fields, reducers, the ref and the constants. They are exhaustive by design, so a
new export has to appear in them.

## SSR

The package touches no browser global: no `window`, no `document`, no
`structuredClone`. Importing and rendering it under Node works unchanged, and
`src/DataGrid.types.test.tsx` runs in the `node` environment to keep it that way.

It is still a client package in the React Server Components sense, because it
uses state and context. The consumer marks their own component `"use client"`;
this package does not carry the directive.

Anything reaching for a browser global, or for `structuredClone`, breaks that
promise. `cloneDataGridState` is deliberately a layered manual copy for this
reason, among others.
