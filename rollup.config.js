import sourceMaps from "rollup-plugin-sourcemaps";
import typescript from "rollup-plugin-typescript2";
import pkg from "./package.json";

// eslint-disable-next-line no-restricted-syntax
export default {
  external: [],
  input: `src/index.ts`,
  output: [
    { file: pkg.main, format: "umd", name: "store", sourcemap: true },
    { file: pkg.module, format: "es", sourcemap: true }
  ],
  plugins: [typescript({ useTsconfigDeclarationDir: true }), sourceMaps()],
  watch: {
    include: "src/**"
  }
};
