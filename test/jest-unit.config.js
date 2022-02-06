module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "../",
  roots: ["<rootDir>/test/unit", "<rootDir>/src"],
  transform: {
    "^.+\\.(ts)$": "ts-jest",
  },
  testRegex: ".*\\.spec\\.ts$",
  testSequencer: "<rootDir>/test/jest-test-sequencer.js",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@config$": ["<rootDir>src/config/index"],
    "^@app$": ["<rootDir>src/app/index"],
    "^@services$": ["<rootDir>src/services/index"],
    "^@utils$": ["<rootDir>src/utils/index"],

    "^@core/(.*)$": ["<rootDir>src/core/$1"],
    "^@app/(.*)$": ["<rootDir>src/app/$1"],
    "^@domain/(.*)$": ["<rootDir>src/domain/$1"],
    "^@services/(.*)$": ["<rootDir>src/services/$1"],
    "^@servers/(.*)$": ["<rootDir>src/servers/$1"],
    "^@graphql/(.*)$": ["<rootDir>src/graphql/$1"],
    "^test/(.*)$": ["<rootDir>test/$1"],
  },
  maxWorkers: 1, // https://github.com/facebook/jest/issues/11617
}
