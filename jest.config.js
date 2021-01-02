module.exports = {
  "roots": [
    "<rootDir>/src"
  ],
  "transform": {
    "^.+\\.(ts)$": "ts-jest"
  },
  "testPathIgnorePatterns": [
    // "example-file",
  ],
  "testSequencer":"./jestTestSequencer.js",
  setupFilesAfterEnv: ['./jest.setup.js'],
  "testEnvironment": "node"
}