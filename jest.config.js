module.exports = {
  moduleFileExtensions: ["js", "json", "ts", "gql"],
  rootDir: ".",
  roots: ["<rootDir>/test"],
  transform: {
    "^.+\\.(ts)$": "ts-jest",
    "^.+\\.(gql)$": "@graphql-tools/jest-transform",
  },
  testRegex: ".*\\.spec\\.ts$",
  testSequencer: "./test/jest-test-sequencer.js",
  setupFilesAfterEnv: ["./test/jest.setup.js"],
  testEnvironment: "node",
  moduleNameMapper: {
    "^@config$": ["<rootDir>src/config/index"],
    "^@app$": ["<rootDir>src/app/index"],
    "^@utils$": ["<rootDir>src/utils/index"],

    "^@core/(.*)$": ["<rootDir>src/core/$1"],
    "^@app/(.*)$": ["<rootDir>src/app/$1"],
    "^@domain/(.*)$": ["<rootDir>src/domain/$1"],
    "^@services/(.*)$": ["<rootDir>src/services/$1"],
    "^@servers/(.*)$": ["<rootDir>src/servers/$1"],
    "^@graphql/(.*)$": ["<rootDir>src/graphql/$1"],
    "^test/(.*)$": ["<rootDir>test/$1"],
  },
}
