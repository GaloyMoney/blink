module.exports = {
  moduleFileExtensions: ["js", "json", "ts", "cjs", "mjs"],
  rootDir: "../",
  roots: ["<rootDir>/test/unit", "<rootDir>/src"],
  transform: {
    "^.+\\.(ts)$": "ts-jest",
    "node_modules/tiny-secp256k1/lib/cjs/.+\\.(js|ts|cjs|mjs)$": "ts-jest",
    "node_modules/uint8array-tools/src/cjs.+\\.(js|ts|cjs|mjs)$": "ts-jest"
  },
  testRegex: ".*\\.spec\\.ts$",
  testSequencer: "<rootDir>/test/jest-test-sequencer.js",
  testEnvironment: "node",
  moduleNameMapper: {
    "^tiny-secp256k1$": "tiny-secp256k1/lib/cjs",
    "^uint8array-tools$": "uint8array-tools/src/cjs",

    "^@config$": ["<rootDir>src/config/index"],
    "^@app$": ["<rootDir>src/app/index"],
    "^@utils$": ["<rootDir>src/utils/index"],

    "^@core/(.*)$": ["<rootDir>src/core/$1"],
    "^@app/(.*)$": ["<rootDir>src/app/$1"],
    "^@domain/(.*)$": ["<rootDir>src/domain/$1"],
    "^@services/(.*)$": ["<rootDir>src/services/$1"],
    "^@servers/(.*)$": ["<rootDir>src/servers/$1"],
    "^@graphql/(.*)$": ["<rootDir>src/graphql/$1"],
    "^test/(.*)$": ["<rootDir>test/$1"],
  },
}
