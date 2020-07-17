module.exports = {
  "roots": [
    "<rootDir>/src"
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