export const config = {
  runner: "local",
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      project: "./tsconfig.json",
      transpileOnly: true,
    },
  },

  specs: ["../test/e2e/specs/**/*.ts"],
  exclude: [],
  maxInstances: 10,

  // remove headless to open browser
  capabilities: [
    {
      "browserName": "chrome",
      "goog:chromeOptions": {
        args: ["--no-sandbox", "--disable-dev-shm-usage", "--headless"],
      },
    },
  ],

  logLevel: "error",
  bail: 0,
  baseUrl: "http://localhost:3000",
  waitforTimeout: 100000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: ["chromedriver"],
  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    ui: "bdd",
    timeout: 60000,
  },
}
