const prettierConfig = require('./.prettier.config');
const { execSync } = require('child_process');
const actualProjectDir = execSync('npm prefix').toString().replace(/\n/g, '');


module.exports = {
    env: {
      browser: true,
      es6: true,
      node: true
    },
    ignorePatterns: ["/*.js", "lib", "coverage", "generated", "protos"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      project: [`${actualProjectDir}/tsconfig.json`],
      tsconfigRootDir: __dirname,
    },
    plugins: ["eslint-plugin-import", "@typescript-eslint", "prettier", "jest"],
    extends: [
      "plugin:jest/recommended",
      "eslint:recommended",
      "plugin:import/recommended",
      "plugin:import/typescript",
      "plugin:@typescript-eslint/recommended",
      "prettier"
    ],
    rules: {
      // Customized rules
      "@typescript-eslint/no-extra-semi": "off", // Prettier work
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/prefer-for-of": "error",
      "@typescript-eslint/unified-signatures": "error",

      "import/no-deprecated": "error",
      "import/no-extraneous-dependencies": "error",
      "import/no-unassigned-import": "error",
      "import/no-unresolved": "off",
      "import/order": ["error", { "newlines-between": "always-and-inside-groups" }],

      "prettier/prettier": [
        "error",
        prettierConfig
      ],

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

      // Temporarily disabled recommended rules
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "no-async-promise-executor": "off",
      "jest/no-disabled-tests": "off"
    },
    settings: {
      "import/resolver": {
        node: {
          paths: ["."]
        }
      }
    }
  }
