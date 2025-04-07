module.exports = {
  plugins: ["import", "@typescript-eslint", "prettier", "jest"],
  env: {
    node: true,
    jest: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    sourceType: "module",
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
    "plugin:jest/recommended",
  ],
  rules: {
    "jest/no-disabled-tests": "off",
    "@typescript-eslint/no-extra-semi": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/prefer-for-of": "error",
    "@typescript-eslint/unified-signatures": "error",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "no-undef": "off",

    // Import
    "import/no-deprecated": "error",
    "import/no-extraneous-dependencies": "error",
    "import/no-unassigned-import": "error",
    "import/no-unresolved": "off",
    "import/order": ["error", { "newlines-between": "always-and-inside-groups" }],

    // General
    "arrow-body-style": "off",
    "prefer-arrow-callback": "error",
    "no-duplicate-imports": "error",
    "no-empty-function": "error",
    "no-empty": ["error", { allowEmptyCatch: true }],
    "no-new-wrappers": "error",
    "no-param-reassign": "error",
    "no-return-await": "error",
    "no-sequences": "error",
    "no-throw-literal": "error",
    "no-void": "error",
    "no-async-promise-executor": "off",
  },
  settings: {
    "import/resolver": {
      node: {
        paths: ["."],
      },
    },
  },
}
