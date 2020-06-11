module.exports = {
  "roots": [
    "<rootDir>/src"
  ],
  "testMatch": [
    "**/?(*.)+(spec|test).+(ts)"
  ],
  "transform": {
    "^.+\\.(ts)$": "ts-jest"
  },
  "testPathIgnorePatterns": [
    // FIXME
    // "lightning",
    "exchange"
  ],
  "testSequencer":"./jestTestSequencer.js"
}