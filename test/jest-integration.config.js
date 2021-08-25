module.exports = {
  moduleFileExtensions: ["js", "json", "ts", "gql"],
  rootDir: "../",
  roots: ["<rootDir>/test/integration"],
  transform: {
    "^.+\\.(ts)$": "ts-jest",
    "^.+\\.(gql)$": "@jagi/jest-transform-graphql",
  },
  testRegex: ".*\\.spec\\.ts$",
  testSequencer: "<rootDir>/test/jest-test-sequencer.js",
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup.js"],
  testEnvironment: "node",
  moduleNameMapper: {
    "^@config/(.*)$": ["<rootDir>src/config/$1"],
    "^@core/(.*)$": ["<rootDir>src/core/$1"],
    "^@app/(.*)$": ["<rootDir>src/app/$1"],
    "^@domain/(.*)$": ["<rootDir>src/domain/$1"],
    "^@services/(.*)$": ["<rootDir>src/services/$1"],
    "^@servers/(.*)$": ["<rootDir>src/servers/$1"],
    "^@graphql/(.*)$": ["<rootDir>src/graphql/$1"],
    "^test/(.*)$": ["<rootDir>test/$1"],
  },
}
