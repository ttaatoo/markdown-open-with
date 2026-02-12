import { defineConfig } from "vite";
import pkg from "./package.json";

export default defineConfig({
  build: {
    lib: {
      entry: "src/extension.ts",
      formats: ["cjs"],
      fileName: "extension",
    },
    rollupOptions: {
      external: Object.keys(pkg.dependencies || {}).concat(["vscode", "child_process"]),
      output: {
        globals: {},
      },
    },
    emptyOutDir: true,
  },
});
