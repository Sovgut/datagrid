import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    dts({
      tsconfigPath: "./tsconfig.app.json",
      entryRoot: "src",
      outDirs: "dist",
      compilerOptions: {
        rootDir: "src",
      },
    }),
  ],
  build: {
    lib: {
      entry: resolve(rootDir, "src/main.ts"),
      name: "DataGrid",
      fileName: "datagrid",
      formats: ["es"],
    },
    rolldownOptions: {
      // `zustand` is deliberately absent: it is a regular dependency and gets
      // bundled, so consumers never have to install or version it themselves.
      // The store it backs is created internally and never shared across
      // package boundaries, so a second copy in the consumer's tree is inert.
      external: ["react", "react-dom", "react/jsx-runtime", "react/compiler-runtime"],
    },
  },
});
