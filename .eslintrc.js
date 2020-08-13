module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "eslint-plugin-tsdoc", "sort-keys-fix"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  rules: {
    "func-style": ["error", "declaration"],
    "no-restricted-syntax": [
      "error",
      "ClassDeclaration",
      "ExportDefaultDeclaration"
    ],
    "sort-keys": [
      "error",
      "asc",
      { caseSensitive: true, natural: false, minKeys: 2 }
    ],
    "sort-keys-fix/sort-keys-fix": "error",
    "@typescript-eslint/no-explicit-any": ["error", { ignoreRestArgs: true }],
    "@typescript-eslint/no-non-null-assertion": "off",
    "tsdoc/syntax": "warn",
    "react/prop-types": "off"
  }
};
