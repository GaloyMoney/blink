module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(ts)$": "ts-jest",
  },
  testPathIgnorePatterns: ["helper.ts"],
  testSequencer: "./jestTestSequencer.js",
  setupFilesAfterEnv: ["./jest.setup.js"],
  testEnvironment: "node",
}
