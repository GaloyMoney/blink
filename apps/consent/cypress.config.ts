import { defineConfig } from "cypress";
import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.test" });

export default defineConfig({
  e2e: {
    baseUrl: "http://127.0.0.1:3000",
    // setupNodeEvents(on, config) {},
  },
  defaultCommandTimeout: 60000,
  env: {
    ...process.env,
  },
  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
  screenshotOnRunFailure: false,
  video: false,
});
