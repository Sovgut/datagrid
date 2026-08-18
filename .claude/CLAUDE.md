# @sovgut/datagrid

Headless, unstyled state management for React data grids: pagination, sorting,
per-column filters, selection and column visibility, with the markup left
entirely to the consumer.

This is a **published library**, not an application. Everything here ends up on a
registry and inside somebody else's build, so the public surface, the emitted
declarations and the version number are part of the product.

This file is the map and the house rules. Everything below `.claude/rules/`
carries the detail; the unconditional ones are already in context, the scoped
ones arrive when you touch their code.

## Commands

```bash
npm run check      # biome check --write --error-on-warnings .  (lint + format + organize imports)
npm run ci         # biome ci --error-on-warnings .             (reports, never rewrites)
npm run typecheck  # tsc -b over all three tsconfig projects
npm test           # vitest run --coverage, gated at 100%
npm run test:watch # vitest, no coverage
npm run build      # tsc -b, then the vite lib build + declaration emit -> dist/
npm run deploy:npm # npm publish --access public
```

**A change is finished when all four of these pass, in this order:**

```bash
npm run check && npm run typecheck && npm test && npm run build
```

These are the four checks `.github/workflows/ci.yml` runs, in its order, with
`check` standing in for `ci` because locally you want the rewrite. No one of
them substitutes for another:

- `check` is Biome. Nothing else in the toolchain formats or lints; Vite never
  invokes it. Run it **first**, because it rewrites files.
- `typecheck` is the type gate, and `build` runs the same `tsc -b` ahead of the
  bundle so a release built by hand cannot ship a type error. Run `typecheck`
  on its own anyway while working: it is the fast, incremental one, and it
  reports without writing anything.
- `test` runs with coverage, and coverage is a hard gate at 100% on lines,
  functions, branches and statements. New code without a test fails the run.
- `build` proves the library bundles and that declarations can be emitted under
  `isolatedDeclarations`, which asks for annotations `noEmit` typechecking never
  demands.

None of them proves the **published** package is correct. What consumers install
is `dist/`, and `dist/` includes the `.d.ts` files. See `rules/public-api.md`.

## Conventions

**TypeScript is turned all the way up.** `strict`, plus
`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitReturns`,
`noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters`,
`noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`,
`erasableSyntaxOnly`, `allowUnreachableCode: false`, and **`isolatedDeclarations`**
on the shipped code. `skipLibCheck` is off everywhere except the build-tool
project.

`verbatimModuleSyntax` means type-only imports are written `import type`.
`allowImportingTsExtensions` means every relative import carries its extension:
`./store/store.ts`, `./DataGrid.tsx`. There is no path alias.

`isolatedDeclarations` is the rule that bites most often: every exported
declaration needs an explicit type annotation, and the annotation you choose
decides what the emitted `.d.ts` imports. `rules/public-api.md` covers the trap.

**Biome**, not ESLint or Prettier: 2-space indent, line width 120, double
quotes, `es5` trailing commas, semicolons always, imports organized by the
assist action. The linter runs `a11y`, `correctness`, `security` and
`suspicious` at error level, plus `noReExportAll` and `noNonNullAssertion`.

**React Compiler is enabled** through `@rolldown/plugin-babel` with
`reactCompilerPreset` in `vite.config.ts`. Memoization is the compiler's job:
hand-written `memo` / `useMemo` / `useCallback` is noise unless it is
load-bearing for identity rather than for speed. What matters instead is obeying
the Rules of React, since a component that breaks them silently loses all
automatic memoization. The `useMemo` and `useCallback` calls that do exist in
`DataSource.tsx` are there for **referential identity** that the context and the
reconciliation effect depend on, not for performance; do not delete them as
redundant.

**Every exported symbol carries a JSDoc block.** For a headless package the
docblock is the documentation surface: it is what a consumer sees on hover, and
it ships in the `.d.ts`. A comment that explains *why* the code resists an
obvious simplification is worth more than one restating the signature.

## Dependencies

- **`react` `^19` is the only peer dependency.** Nothing else is required of a
  consumer.
- **`zustand` is a devDependency and is bundled into `dist/datagrid.js`.** It
  backs the built-in store. It must never appear in `dependencies`, never be
  listed in the build's `external`, and never be nameable from an emitted
  declaration file. All three are separate mistakes with the same symptom for a
  consumer. See `rules/public-api.md`.
- Everything else is dev tooling: Vite, `vite-plugin-dts`, Vitest, Testing
  Library, jsdom, Biome, TypeScript, the React Compiler babel plugin.

The build is **ESM only** (`"type": "module"`, `formats: ["es"]`), ships
`"sideEffects": false`, and exports exactly two entry points: `.` and
`./package.json`. The `.` entry answers both `import` and `require` with the
same file, so a CJS caller on a Node that supports `require(esm)` gets the one
module instance rather than a second copy. `rules/toolchain.md` has the detail.

## The layers

```
src/main.ts          the public entry point: the whole published surface
src/DataGrid.tsx     creates the store, provides it, renders DataSource
src/DataSource.tsx   the engine: derivation, reconciliation, callbacks, the ref
src/store/           the zustand store, its context and its selector hook
src/internal/        the context DataSource fills and useDataGrid reads
src/utils.ts         state cloning and the two equality checks
src/constants.ts     the DATAGRID_DEFAULT_* baseline
src/types.ts         the public types
src/enums.ts         DataGridColumnVisibility
```

There are **two contexts**, and they are not interchangeable:

- `DataGridStoreContext` (`src/store/context.ts`) carries the zustand store.
  `DataGrid` provides it; only `useDataGridState` reads it. It is internal.
- `InternalDataGridContext` (`src/internal/context.ts`) carries the fully
  derived state, the actions, and `columns` / `rows` / `size`. `DataSource`
  provides it; `useDataGrid` reads it. **This is what consumer components see.**

A consumer never touches the store directly. `store` and `query` on `<DataGrid>`
are the only ways in, and they are mutually exclusive by type.

## Documentation map

**Always in context** - read them as given, they describe how this package
behaves:

| Rule | Covers |
| :--- | :--- |
| `rules/architecture.md` | The layers, the render and state flow, what each file owns, and why the shape resists the obvious simplifications. |
| `rules/public-api.md` | What is exported and what breaking it costs: semver, the `key` contract, the declaration-emission traps, and the README's obligation to stay true. |

**Arrive when you touch their code**:

| Rule | Triggers on |
| :--- | :--- |
| `rules/state.md` | `src/store/**`, `DataSource.tsx`, `DataGrid.tsx`, `utils.ts`, `constants.ts` |
| `rules/testing.md` | any `*.test.ts` / `*.test.tsx`, `vitest.config.ts`, `vitest.setup.ts` |
| `rules/toolchain.md` | `vite.config.ts`, `tsconfig*.json`, `biome.json`, `package.json`, `.github/**` |

## The backlog

**`.claude/BACKLOG.md`** holds known traps, debts and findings that were out of
scope when they were found. It is **local and untracked** - notes for this
machine, not for the team. `.gitignore` versions `CLAUDE.md` and `rules/` and
nothing else under `.claude/`.

It is not loaded automatically, so read it deliberately:

- before working on an area you know is rough, or when something behaves oddly
  and the cause is not obvious - an entry may already describe it;
- when a change lands in an area an entry covers, so the entry can be deleted in
  the same task.

**Append to it whenever you find something worth surviving the session** - code
that contradicts a documented rule, a stale comment, a latent trap, a small debt
- and say in your reply that you did. Every entry states what is wrong, **where**
(paths, line numbers), why it matters, and how to fix it. Delete an entry when
its subject is fixed or turns out to be wrong; a stale backlog is worse than an
empty one.

It is a list of notes, not a plan: do not start working through it unless asked.

## Where a symptom usually comes from

The cause of a visible problem rarely lives where you see it:

| Symptom | Look first at |
| :--- | :--- |
| A consumer cannot resolve `zustand` when typechecking | `rules/public-api.md` - a declaration file names it in an import |
| A consumer downloads `zustand` they never import | `rules/public-api.md` - it drifted back into `dependencies` |
| `query` looks ignored | `rules/state.md` - a `store` was passed too, or `query` changed after the first render |
| `onChange` fires in a loop on mount | `rules/state.md` - the reconciliation effect and the two equality checks |
| A `deriveState` result never reaches the store | `rules/state.md` - `isFilterEqual` decides, and it treats `{ a: undefined }` and `{}` as different on purpose |
| A `deriveProps` declaration seems to do nothing | `rules/architecture.md` - the core never calls it; the rendering layer does |
| Everything re-renders on every parent render | `rules/architecture.md` - unmemoized `columns` / `rows` from the consumer |
| `ref.current` holds values from an earlier render | `rules/architecture.md` - the imperative handle is deliberately dependency-free |
| The page does not reset when a filter changes | `rules/state.md` - `resetPageOnQueryChange` |
| A new export compiles locally but fails the build | `rules/toolchain.md` - `isolatedDeclarations` needs an explicit annotation |
| Coverage fails on an untouched file | `rules/testing.md` - the gate is 100% and global |
| A released version never reaches GitHub Packages | `rules/toolchain.md` - the release workflow only runs when `package.json` `version` changes on `main` |
| A version is on GitHub Packages but not on npm | `rules/toolchain.md` - npm is published by hand |

## Shorthands

These names resolve **relative to this repository**, and they resolve the same
way whether or not the file exists today. If one is missing, say so - do not
substitute another location.

| Shorthand | Resolves to | If absent |
| :--- | :--- | :--- |
| `@docs` | This project's documentation: `.claude/CLAUDE.md` plus everything in `.claude/rules/`. | n/a - it is this file and its rules |
| `@readme` | `README.md` - the package's public documentation, the one artifact consumers actually read. | n/a - it is versioned |
| `@working` | `.working/` - the in-repo scratch directory. Informal material, never product code. | say the directory does not exist |
| `@todo` | `.working/TODO.md` - the user's draft task list. Read it whole for intent; **never reformat or edit it**. | say there is no TODO and treat the request itself as the whole spec |
| `@backlog` | `.claude/BACKLOG.md` - local, untracked notes (see "The backlog"). | create it when the first entry is worth writing |

A loose filename after one of these ("look in `@working` at file X") means a file
in that directory: list the directory rather than guessing at a name.

## The working directory

`.working/` is an in-repo scratch area, not part of the product and not
documentation. It is gitignored in full.

**`.working/TODO.md`** is the user's draft task list. Read it whole for the
intent behind a change; the surrounding items say what an item means. **Never
reformat it and never edit it** - it is their scratchpad.

## Releasing

Two registries, and they behave differently:

- **GitHub Packages publishes itself.** A push to `main` that changes the
  `version` in `package.json` runs `check-version` -> `build` -> `deploy-github`,
  authenticating with the automatic `GITHUB_TOKEN`. Nothing to configure.
- **npm is published by hand**, on purpose, so no long-lived token lives in the
  repository: `npm i`, `npm run build`, `git push`, then `npm run deploy:npm`.

So the two registries can be minutes or days apart, and GitHub is always first.
Do not bump `version` as part of an unrelated change: the bump **is** the release
trigger. `rules/toolchain.md` has the detail.

## Commits

Conventional subject (`fix(store): ...`, `feat(core): ...`, `docs: ...`,
`ci: ...`, `chore(build): ...`), then a body in prose that explains the **root
cause and the design**, not the diff. State what was verified and how. The
history is the place for the story of a change; no other artifact in this
repository narrates its own past.
