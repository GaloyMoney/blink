import { defineConfig } from "cypress"
import dotenv from "dotenv"
dotenv.config({ path: "../../dev/.envs/consent-test.env" })

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
  },
  defaultCommandTimeout: 60000,
  env: {
    AUTHORIZATION_URL: process.env.AUTHORIZATION_URL,
  },
  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
  screenshotOnRunFailure: false,
  video: false,
  retries: {
    openMode: 1,
    runMode: 2,
  },
})
