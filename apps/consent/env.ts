import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    AUTH_URL: z.string().default("http://localhost:4002"),
    HYDRA_ADMIN_URL: z.string().default("http://localhost:4445"),
  },
  client: {},
  runtimeEnv: {
    AUTH_URL: process.env.AUTH_URL,
    HYDRA_ADMIN_URL: process.env.HYDRA_ADMIN_URL,
  },
});
