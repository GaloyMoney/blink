const swcConfig = require("../swc-config.json")

module.exports = {
  moduleFileExtensions: ["js", "json", "ts", "cjs", "mjs"],
  rootDir: "../../",
  roots: ["<rootDir>/test/unit", "<rootDir>/src"],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", swcConfig],
  },
  testRegex: ".*\\.spec\\.ts$",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": ["<rootDir>/src/$1"],
    "^test/(.*)$": ["<rootDir>/test/$1"],
  }
}
