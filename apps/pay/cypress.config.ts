import { defineConfig } from "cypress"

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3002",
  },
  defaultCommandTimeout: 30000,
  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
  screenshotOnRunFailure: false,
  retries: {
    openMode: 1,
    runMode: 3,
  },
})
