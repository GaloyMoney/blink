import { defineConfig } from "cypress"
import dotenv from "dotenv"

dotenv.config({ path: "../../dev/.envs/next-auth-session.env" })

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3001",
  },
  defaultCommandTimeout: 60000,
  env: {
    NEXT_AUTH_SESSION_TOKEN: process.env.NEXT_AUTH_SESSION_TOKEN,
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
