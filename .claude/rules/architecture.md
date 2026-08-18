---
# Unconditional: this is the map. Every symptom in a headless package surfaces
# one layer away from its cause, and the shape below is what decides which.
---

# Architecture

How the package is put together: the layers, the flow of a state change, and the
places where the obvious simplification is wrong.

> **Golden rules**
> 1. The core owns **state**, never markup. If a change needs to know what the
>    DOM looks like, it belongs in the consumer's rendering layer.
> 2. Derived state is computed **before** it is written, in one place. Never add
>    a second effect that corrects the store after the fact.
> 3. The public surface is `src/main.ts`. Anything not re-exported there is
>    internal and free to change; anything re-exported is a semver commitment.

## The files

| File | Owns |
| :--- | :--- |
| `src/main.ts` | The published surface. A re-export list and nothing else. |
| `src/DataGrid.tsx` | Creating the built-in store once, providing it, and the `query` / `store` choice. |
| `src/DataSource.tsx` | The engine: derivation, reconciliation, the five actions, `onChange` / `onSelect`, the imperative handle, the consumer-facing context. |
| `src/store/store.ts` | `DataGridState`, `DataGridReducer`, `DataGridStore`, and the zustand factory. |
| `src/store/context.ts` | The context carrying the store instance. Internal. |
| `src/store/hook.ts` | `useDataGridStore(selector)`. Internal; throws outside the provider. |
| `src/internal/context.ts` | The context carrying derived state + actions + data. |
| `src/internal/hook.ts` | `useDataGrid()` for consumers, `useDataGridState()` for picking the store. |
| `src/utils.ts` | `cloneDataGridState`, `isSelectedEqual`, `isFilterEqual`. |
| `src/constants.ts` | The `DATAGRID_DEFAULT_*` baseline, exported to consumers. |
| `src/types.ts` | The public types: rows, columns, filters, the ref. |
| `src/enums.ts` | `DataGridColumnVisibility`, a const object plus a matching type. |

## Two contexts, two audiences

`DataGridStoreContext` carries the zustand store. `DataGrid` provides it and
only `useDataGridState` reads it. It exists so the store can be created once, in
a `useState` initializer, and reached without prop drilling.

`InternalDataGridContext` carries the **derived** state, the five actions, and
`columns` / `rows` / `size`. `DataSource` provides it and `useDataGrid` reads it.
This is the one consumers see.

Collapsing them would leak the store type into the consumer-facing API and, with
it, zustand into the emitted declarations. Keep them apart.

## The flow of a state change

Every action follows the same four steps, and they are ordered deliberately:

1. Start from `derivedState`, not from the raw store, so a chain of calls in one
   tick composes correctly.
2. Apply the change (page, sorting, filter, selection, or a whole state).
3. Run `calculateDerivedState`, which clones the state and pipes it through
   every column's `filterConfig.deriveState` **in column order**, each function
   receiving what the previous one returned.
4. Write the result with `setState`, then report it with `onChange` / `onSelect`.

The callbacks always report **what reached the store**, never the raw argument.
A `deriveState` may adjust the value on its way through, and a callback that
disagreed with the store would put the consumer's copy out of sync with the
grid's.

## Reconciliation

`DataSource` also holds a `useMemo` that derives the current store state and
compares the result to what the store holds, field by field, with
`isSelectedEqual` and `isFilterEqual` for the two structural fields. If they
differ, `shouldChange` is true and an effect writes the derived state back.

This is what makes the first render correct: on mount the store holds whatever
`query`, an external store, or the defaults put there, and no action has run, so
nothing has applied the columns' derivations yet. It is also what recovers when
`columns` changes and brings a new derivation with it.

The comparison is the loop guard. It has to stay exact in both directions:
report a difference that is not there and the effect writes on every render;
miss a real one and the store never converges. `rules/state.md` covers the two
equality functions and why `JSON.stringify` is not one of them.

## `deriveState` and `deriveProps` are not a pair

They look symmetric and are not:

- **`deriveState` runs here.** The core calls it, once per column that declares
  one, on every derivation.
- **`deriveProps` never runs here.** It is a declaration the rendering layer
  reads during its own render, merging the result into the filter element. Only
  the layer that owns the markup knows how to apply props to it, whether by
  `cloneElement`, a render prop, or something else.

A search for "deriveProps is not being called" ends here: the core is not the
one that calls it.

## Referential identity is load-bearing

React Compiler is on, so memoization for **speed** is not written by hand. The
`useMemo` and `useCallback` in `DataSource.tsx` are there for **identity**: they
feed the context value and the reconciliation effect's dependency list. Removing
them as redundant reintroduces a render loop.

The imperative handle is the mirror image. `useImperativeHandle` is declared
**without a dependency array on purpose**: the handle carries state *values*
alongside the actions, so it must be rebuilt on every render. Pinning it to a
dependency list hands the parent a `ref.current` holding state from an earlier
render, which is the exact failure the API exists to avoid.

## What the consumer must memoize

`columns` and `rows` arrive as props and their identity drives everything above:
the derivation memo, every action callback, and the context value. A column
array written inline is a new array on every render, so the grid re-derives and
every consumer of the context re-renders.

The grid cannot fix this for the consumer. Columns hold JSX elements and
functions, so there is nothing to compare structurally. The README says to
memoize them; keep saying it, and do not try to work around it with a deep
comparison here.

## Where new behaviour goes

- A new piece of query state: `DataGridState`, the store factory's defaults, a
  `DATAGRID_DEFAULT_*` constant, the snapshot in `DataSource`'s derivation memo,
  every action that rebuilds a raw state, `clear`, and the ref. Missing one of
  those is how a field ends up silently dropped by `clear` or by `setState`.
- A new column capability: `types.ts` first, then whatever in `DataSource` has
  to read it. Most column capabilities are declarations the rendering layer
  reads and the core never touches; prefer that.
- Anything that needs the DOM: it does not go in this package.
