const swcConfig = require("../swc-config.json")

module.exports = {
  moduleFileExtensions: ["js", "json", "ts", "cjs", "mjs"],
  rootDir: "../../",
  roots: ["<rootDir>/test/legacy-integration"],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", swcConfig],
  },
  testRegex: ".*\\.spec\\.ts$",
  testSequencer: "<rootDir>/test/legacy-integration/jest-test-sequencer.js",
  setupFilesAfterEnv: ["<rootDir>/test/legacy-integration/jest.setup.js"],
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": ["<rootDir>/src/$1"],
    "^test/(.*)$": ["<rootDir>/test/$1"],
  }
}
