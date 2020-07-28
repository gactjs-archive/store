import sourceMaps from "rollup-plugin-sourcemaps";
import typescript from "rollup-plugin-typescript2";

import pkg from "./package.json";

// eslint-disable-next-line no-restricted-syntax
export default {
  input: `src/index.ts`,
  output: [
    { file: pkg.main, name: "key", format: "umd", sourcemap: true },
    { file: pkg.module, format: "es", sourcemap: true }
  ],
  external: [],
  watch: {
    include: "src/**"
  },
  plugins: [typescript({ useTsconfigDeclarationDir: true }), sourceMaps()]
};
