module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "../",
  roots: ["<rootDir>/test/integration"],
  transform: {
    "^.+\\.(ts)$": "ts-jest",
  },
  testRegex: ".*\\.spec\\.ts$",
  testSequencer: "<rootDir>/test/jest-test-sequencer.js",
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup.js"],
  testEnvironment: "node",
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
    "^test/(.*)$": "<rootDir>/test/$1",
  },
}
