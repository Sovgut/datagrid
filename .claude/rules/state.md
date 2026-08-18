---
paths:
  - "**/src/store/**"
  - "**/src/DataSource.tsx"
  - "**/src/DataGrid.tsx"
  - "**/src/utils.ts"
  - "**/src/constants.ts"
---

# State

The whole product is this: one state object, five actions, a derivation pass,
and a reconciliation guard.

## The state

| Field | Type | Default | Notes |
| :--- | :--- | :--- | :--- |
| `page` | `number` | `1` | 1-based |
| `limit` | `number` | `10` | |
| `sort` | `string \| null` | `null` | a column `key`; single-column sorting only |
| `order` | `"asc" \| "desc" \| null` | `null` | |
| `filter` | `Record<string, any>` | `{}` | keyed by column `key` |
| `selected` | `string[]` | `[]` | row ids |

**`null` is the only spelling of "unsorted".** `setSorting` accepts `undefined`
for either argument and normalizes it, so a call site does not need a guard, but
the state never holds one. Two spellings of absence in a public type is a trap,
not a convenience; do not reintroduce `undefined` into `DataGridState`.

The store factory does not spread `initProps`. It copies entry by entry and
skips `undefined` values, because a spread would let `query={{ sort: undefined }}`
put `undefined` into a field the public type promises is `string | null`.

## Who owns the state

`query` and `store` on `<DataGrid>` are mutually exclusive, and the type enforces
it:

- **`query`** seeds the grid's own store, on the first render only. It is the
  `defaultValue` role. Changing it afterwards does nothing, and pairing it with
  `onChange` is how a parent follows along.
- **`store`** hands ownership over: any object satisfying `DataGridReducer` will
  do, and the grid reads and writes through it instead of its own. It is the
  `value` role, and the extension point a URL-syncing layer is built on. Seed it
  where it is created.

Passing both is a compile error. A grid given a `store` never reads the internal
one that `query` seeds, so accepting both would silently drop the seed.

`useDataGridState` is the selector: an external store wins, otherwise the
internal one. It calls `useDataGridStore` unconditionally first, because a hook
cannot be called conditionally.

## Derivation

`calculateDerivedState(state, columns)` clones the state, then pipes it through
every column's `filterConfig.deriveState`, **in column order**, each function
receiving what the previous one returned. Column order is therefore meaningful
for dependent filters, and a column with no `deriveState` is skipped without
disturbing the chain.

Every action derives **before** writing. There is no post-write correction pass.

### The `deriveState` contract

The context handed in is a copy the function may mutate. `cloneDataGridState`
makes three levels fresh: the state object, its `filter` object, and its
`selected` array. That is exactly the depth an implementation reaches when it
does what the API is for:

```ts
deriveState: (ctx) => {
  ctx.filter.method = undefined;   // safe, `filter` is a fresh object
  delete ctx.filter.currency;      // safe
  return ctx;
}
```

Values *nested inside* a filter entry are shared with the store by reference.
Treat filter values as immutable and replace them rather than editing in place.

**A deep clone is rejected on purpose.** `structuredClone` throws on functions
and React elements, both of which a consumer may legitimately park in a filter
value, and it is unavailable without a DOM in some runtimes. The
`JSON.parse(JSON.stringify(...))` fallback silently drops `undefined` and
flattens `Date`, `Map` and `Set`. The layered copy touches neither, which is
also what keeps the package SSR-safe.

A missing `filter` or `selected` is normalized to an empty one rather than
propagated, so the return value always satisfies `DataGridState`.

## Reconciliation, and the loop it guards

`DataSource` derives from the current store state in a `useMemo` and compares
the result field by field. If anything differs, an effect writes the derived
state back and reports it once through `onChange`.

This is what applies the columns' derivations on mount, when nothing has called
an action yet, and what recovers when `columns` arrives with a new derivation.

The comparison is the loop guard, and it has to be exact in both directions.
Report a difference that is not there and the effect fires on every render;
miss a real one and the store never converges. The scalars compare with `!==`;
`filter` and `selected` need the two helpers.

### `isSelectedEqual`

Compares by value, element by element, with `Object.is`. **Order is
significant**: the same ids in a different order are different, because the
order is the consumer's to define and the grid must not silently discard a
reordering.

### `isFilterEqual`

Compares one level deep, with array values compared element by element.

It exists because `JSON.stringify` was wrong in both directions:

- `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` compared as different, since key order
  leaks into the serialized form;
- `{ a: undefined }` and `{}` compared as equal, since `JSON.stringify` drops
  `undefined` entries. That case is not academic: a `deriveState` that
  invalidates a dependent filter usually does it by assigning `undefined`, and
  that change has to reach the store.

The comparison assumes a filter value is a primitive or an array of primitives,
which is the contract the package documents and the shape a filter needs to
survive a round trip through a URL query string. Anything else compares by
reference.

Any change to either helper needs a test on both sides: a difference that must
be reported, and a non-difference that must not be.

## The actions

| Action | Resets page? | Reports through |
| :--- | :--- | :--- |
| `setPagination(page, limit)` | no | `onChange` |
| `setSorting(sort, order)` | when `resetPageOnQueryChange` | `onChange` |
| `setFilter(filter)` | when `resetPageOnQueryChange` | `onChange` |
| `setSelected(selected)` | no | `onSelect` |
| `setState(state)` | no | `onChange` **and** `onSelect` |

`resetPageOnQueryChange` defaults to `true` and resets to
`DATAGRID_DEFAULT_PAGE`, not to whatever page the grid started on.

Every callback reports the state **after** derivation, never the raw argument.

`clear()` on the ref resets to the `DATAGRID_DEFAULT_*` baseline and then applies
the derivations. The baseline is the package defaults, **not** the `query` the
grid started with; returning to a consumer's own baseline is `setState` with it.

## Adding a state field

The field has to be added in every one of these places, and a miss is silent:

1. `DataGridState` in `store/store.ts`.
2. A `DATAGRID_DEFAULT_*` constant, with an explicit type annotation.
3. The `defaults` object in `createDataGridStore`.
4. The `localSnapshot` in `DataSource`'s derivation memo, and the comparison
   below it.
5. Every action that rebuilds a raw state from `derivedState`.
6. The `defaultState` inside `clear`.
7. A reducer, if it needs its own setter, on `DataGridReducer` and the store.
8. The README's `DataGridState` table.

The compiler covers most of that list: `calculateDerivedState` takes a whole
`DataGridState`, so a field missing from the snapshot (4), from the store
defaults (3) or from `clear` (6) is a type error at the call site. Verified by
adding a field to `DataGridState` and reading what `tsc -b` reports.

**The comparison chain under the snapshot is the part nothing checks.** A new
field that never joins it is simply never reconciled: the mount pass ignores it,
and a `deriveState` that changes it never gets written back. The README table
(8) is unchecked for the same reason.
