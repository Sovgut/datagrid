---
paths:
  - "**/vite.config.ts"
  - "**/tsconfig*.json"
  - "**/biome.json"
  - "**/package.json"
  - "**/.github/**"
---

# Toolchain and release

How the package is compiled, checked and published.

## The build

`vite.config.ts` produces one thing: an ES-only library bundle plus its
declarations.

- **Entry** `src/main.ts`, output `dist/datagrid.js`, `formats: ["es"]` only.
- **`@vitejs/plugin-react`** for JSX, and **`@rolldown/plugin-babel`** running
  `reactCompilerPreset` so the React Compiler processes the source.
- **`vite-plugin-dts`** emits the declaration tree from `tsconfig.app.json`,
  with `entryRoot: "src"` and `rootDir: "src"` so `dist/` mirrors `src/`.
- **`external`** lists React only: `react`, `react-dom`, `react/jsx-runtime`,
  `react/compiler-runtime`.

**`zustand` is deliberately absent from `external`.** It is bundled, so
consumers never install or version it, and the store it backs is created inside
the grid and never crosses a package boundary, which makes a second copy in a
consumer's tree inert. Adding it to `external` would ship an import consumers
cannot resolve. See `rules/public-api.md` for the two sibling requirements that
have to hold with it.

**The build gates types itself.** The script is `tsc -b && vite build`, so a
type error stops it before anything is written to `dist/`. The `tsc -b` is the
same one `npm run typecheck` runs and is incremental, so it costs nothing when
the types are already clean.

That prefix is load-bearing, not belt-and-braces. `vite-plugin-dts` prints the
diagnostics it finds while emitting declarations but never fails the run on
them, so a bare `vite build` reports a `TS2322` in full and still exits 0 with
`dist/` written. Since npm is published by hand from a local `npm run build`,
that exit code is the last gate a release passes.

## The TypeScript projects

`tsconfig.json` is a solution file with no files of its own, referencing three
projects. `npm run typecheck` is `tsc -b` over all of them.

| Project | Covers | Distinctive settings |
| :--- | :--- | :--- |
| `tsconfig.app.json` | `src`, excluding tests | `isolatedDeclarations`, `stableTypeOrdering`, `declaration`, `types: []` |
| `tsconfig.test.json` | all of `src` plus `vitest.setup.ts` | `types: ["node"]`, no `isolatedDeclarations` |
| `tsconfig.node.json` | `vite.config.ts`, `vitest.config.ts` | `types: ["node"]`, `skipLibCheck: true` |

Three settings are load-bearing and carry a comment in the file saying so:

- **`types: []`** in the app project must stay an explicit empty list. Dropping
  the key makes TypeScript pull in every installed `@types` package, and
  `@types/node` would leak `process` and `Buffer` into browser-only code.
- **`skipLibCheck: true`** in the node project is the only place it is on. Off,
  it surfaces errors inside build-tool typings this package neither owns nor
  ships. It stays **off** in the other two, which is what makes the emitted
  declarations trustworthy.
- **`isolatedDeclarations`** on the app project requires an explicit type
  annotation on every exported declaration. The annotation decides what the
  emitted `.d.ts` imports, which is how a bundled dependency leaks onto the
  public type path.

Every project runs the same strictness block: `strict`,
`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitReturns`,
`noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters`,
`noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`,
`strictBuiltinIteratorReturn`, `erasableSyntaxOnly`, `allowUnreachableCode:
false`, `allowUnusedLabels: false`. A new project copies the block.

`allowImportingTsExtensions` and `verbatimModuleSyntax` are on everywhere:
relative imports carry `.ts` / `.tsx`, and type-only imports say `import type`.

## Biome

One tool for lint, format and import organization; there is no ESLint and no
Prettier.

`npm run check` rewrites files and is what you run locally. `npm run ci` reports
and fails without touching anything, and is what CI runs. Both pass
`--error-on-warnings`, so a warning is a failure.

Rules run at error level for `a11y`, `correctness`, `security` and `suspicious`,
plus `performance/noReExportAll` and `style/noNonNullAssertion`. The linter's
`domains` are all on: `types`, `project`, `test`.

Format: 2-space indent, LF, width 120, double quotes (JSX included), `es5`
trailing commas, semicolons always, bracket spacing on.

A `biome-ignore` needs a reason on the same line, and the reason has to say why
the rule is wrong here rather than that the code is fine. `src/types.ts` has the
one legitimate example, aliasing `any` on purpose.

The `overrides` block turns `noNodejsModules` off for `*.config.ts` and
`vitest.setup.ts`, which are the only files that legitimately import from Node.

## CI

`ci.yml` runs on every push except to `main`, on every pull request, and on
demand. It is the four commands in order:

```
npm ci -> npm run ci -> npm run typecheck -> npm test -> npm run build
```

Node 22.x. Nothing here publishes.

## Releasing

`workflow.yml` runs on a push to `main` that touches `package.json`, and it is
the release trigger:

1. **`check-version.yml`** compares `package.json`'s `version` against the same
   file at `HEAD~1` and outputs `is-changed`.
2. **`build.yml`** runs only when the version changed, repeats the full check
   sequence, and uploads `dist/` as an artifact named for the version.
3. **`deploy-github.yml`** downloads that artifact and publishes to GitHub
   Packages, authenticating with the automatic `GITHUB_TOKEN`.

So the bump **is** the release. Do not change `version` as part of an unrelated
change, and do not expect a release from a push that leaves `package.json`
untouched.

**npm is published by hand**, deliberately, so that no long-lived credential
lives in the repository and nothing has to be rotated every 90 days:

```bash
npm i
npm run build
git push
npm run deploy:npm    # npm publish --access public
```

GitHub Packages is therefore always first, and the two registries can be apart.
Check both before telling anyone a version is out.

## The manifest

`package.json` is part of the public surface. The fields that decide what
consumers get:

- `"files": ["dist"]` - nothing else is packed.
- `"type": "module"`, `"sideEffects": false`, `main` / `types` / `exports`
  pointing into `dist/`. `exports` is closed: `.` and `./package.json` only.
- **The `.` entry answers `import` and `require` with the same ESM file.** That
  is what keeps a CJS caller from getting a second copy: the module-level React
  contexts are singletons, and two instances of them would make a `useDataGrid`
  from one copy throw inside a `<DataGrid>` from the other. Never resolve the
  two conditions to different files, which is what shipping a separate CJS
  build would do. `require()` needs a Node with `require(esm)` support; older
  ones fail with `ERR_REQUIRE_ESM`, which at least names the real problem.
- **`main` and `types` still earn their place.** A TypeScript consumer on
  `moduleResolution: node10` never reads `exports`, and compiles against this
  package only through those two fields. Verified against a packed tarball.
- `"peerDependencies": { "react": "^19.0.0" }` - the only thing a consumer must
  install.
- `"engines": { "node": ">=20" }`, while CI runs 22.x.
- `dependencies` is **empty and stays empty**. A runtime dependency here is
  something every consumer downloads.
