module.exports = {
  "roots": [
    "<rootDir>/lib"
  ],
  "transform": {
    "^.+\\.(ts)$": "ts-jest"
  },
  "testPathIgnorePatterns": [
    "helper.ts",
  ],
  "testSequencer":"./jestTestSequencer.js",
  setupFilesAfterEnv: ['./jest.setup.js'],
  "testEnvironment": "node"
}