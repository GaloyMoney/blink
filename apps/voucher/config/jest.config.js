module.exports = {
  roots: ["<rootDir>/test/unit"],
  rootDir: "../",
  testEnvironment: "node",
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "ts-jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
