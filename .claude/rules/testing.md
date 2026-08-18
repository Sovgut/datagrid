---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/vitest.config.ts"
  - "**/vitest.setup.ts"
---

# Tests

Vitest, Testing Library, and a coverage gate that is not negotiable.

## Running them

```bash
npm test        # vitest run --coverage
npm run test:watch
```

`npm test` **is** the coverage run. There is no separate coverage command, so
every local run enforces the gate.

## The gate

`vitest.config.ts` sets all four thresholds to 100: lines, functions, branches,
statements. Coverage covers `src/**/*.{ts,tsx}` minus the test files and minus
`src/main.ts`, which is a re-export list with nothing to execute.

The gate is global, so an uncovered branch anywhere fails the whole run,
including one added by a change elsewhere. Adding code means adding the test
that reaches it, in the same change. Do **not** lower a threshold or widen the
`exclude` list to get a run green.

If a branch is genuinely unreachable, the answer is to delete the branch, not to
exempt it.

## Environments

The default environment is `jsdom`, because most of the suite renders
components. A file that must prove the package works **without a DOM** opts out
with a docblock on its first line:

```ts
// @vitest-environment node
```

`store.test.ts`, `utils.test.ts`, `enums.test.ts` and `DataGrid.types.test.tsx`
run under `node` for exactly that reason. The SSR promise in the README is what
those runs defend, so keep them there.

`globals: false`. Import `describe`, `it`, `expect` and `vi` explicitly.
Testing Library only registers its own `afterEach(cleanup)` when globals are on,
so `vitest.setup.ts` wires the unmount by hand; without it every render stays in
the document and queries start matching elements from earlier tests.

## Type-level tests

`src/DataGrid.types.test.tsx` asserts things the runtime cannot: that `query`
and `store` are mutually exclusive, and that passing both is an error. The
assertions **are** the annotations and the `@ts-expect-error` suppressions, and
the file failing to compile is the failure.

Vitest transpiles without typechecking, so a runtime-only run proves nothing
here. `npm run typecheck` is what enforces it, through `tsconfig.test.json`.

A `@ts-expect-error` is itself an assertion in both directions: if the error it
suppresses stops occurring, the suppression is unused and typecheck fails. That
is the point, so do not replace one with `@ts-ignore`.

## How a test is named

The name states the behaviour that must hold, in the present tense, as a
sentence that reads on from `it`:

> ✓ `it("reports what reached the store, not the raw argument")`
> ✓ `it("treats an explicit undefined entry as different from a missing one")`
> ✓ `it("ignores a changed query prop after the first render")`
> ✗ `it("regression for the deriveState bug")`
> ✗ `it("works")`

A `describe` names the thing under test or the scenario: `deriveState`,
`external store`, `ref.clear`, `the mount synchronization pass`.

Where a test exists to defend a specific trap, say so in the name rather than in
a comment about how the trap was found:
`it("works without a DOM, which is what makes the package usable during SSR")`.

## What is worth testing here

The package is state logic, so the valuable tests are about **what reaches the
store and what gets reported**, not about rendering:

- an action's result after derivation, read back through the ref;
- how many times `onChange` / `onSelect` fired, since firing twice on mount is a
  real and recurring failure;
- both directions of every equality check, one difference that must be reported
  and one non-difference that must not be;
- isolation: two grids on one page, and a `deriveState` that mutates its context
  not reaching the object the store holds;
- an **external store**, including a malformed one that fails to supply fields,
  since `DataGridReducer` is implemented by consumers and the type system does
  not police what they hand over.

Render with `@testing-library/react`, drive the grid through
`createRef<DataGridRef>()` and `act`, and assert on `ref.current`. A child
component that calls `useDataGrid()` is the way to assert what the context
exposes.
