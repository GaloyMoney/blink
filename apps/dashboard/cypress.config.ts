import { defineConfig } from "cypress"
import dotenv from "dotenv"

dotenv.config({ path: ".next-auth-session.env" })

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3001",
  },
  defaultCommandTimeout: 30000,
  env: {},
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
    runMode: 3,
  },
})
