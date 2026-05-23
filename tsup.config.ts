import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/Box.ts",
    "src/Annotation.ts",
    "src/Ansi.ts",
    "src/Cmd.ts",
    "src/Reactive.ts",
    "src/Html.ts",
    "src/Renderer.ts",
  ],
  format: ["esm"],
  target: "es2022",
  dts: false,
  sourcemap: false,
  clean: true,
  external: ["effect"],
});
