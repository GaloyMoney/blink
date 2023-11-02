import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    HYDRA_ADMIN_URL: z.string().default("http://localhost:4445"),
    CORE_AUTH_URL: z.string().default("http://localhost:4455/auth"),
  },
  shared: {
    GRAPHQL_ENDPOINT: z.string().default("http://localhost:4455/graphql"),
    NODE_ENV: z.string(),
  },
  runtimeEnv: {
    CORE_AUTH_URL: process.env.CORE_AUTH_URL,
    HYDRA_ADMIN_URL: process.env.HYDRA_ADMIN_URL,
    GRAPHQL_ENDPOINT: process.env.GRAPHQL_ENDPOINT,
    NODE_ENV: process.env.NODE_ENV,
  },
})
