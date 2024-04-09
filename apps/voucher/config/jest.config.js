module.exports = {
  roots: ["<rootDir>/test/unit"],
  rootDir: "../",
  testEnvironment: "node",
  // setupFilesAfterEnv: ["<rootDir>/config/jest.setup.js"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "ts-jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
