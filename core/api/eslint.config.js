const { FlatCompat } = require("@eslint/eslintrc")
const js = require("@eslint/js")
const path = require("node:path")

const ignores = [
  "lib",
  "coverage",
  "generated",
  "protos",
  "dist",
  "node_modules",
  "**/proto/**/*.js",
  "**/*.pb.js",
  "**/jest.config.js",
  "**/jest.setup.js",
  "src/migrations/migrate-mongo-config.js",
  "src/migrations/**/*.ts",
  "**/services/price/grpc.ts",
]

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

module.exports = [
  {
    ignores,
  },
  ...compat.config({
    extends: ["./.eslintrc.js"],
  }),
]
