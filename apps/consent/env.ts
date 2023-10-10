import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    HYDRA_ADMIN_URL: z.string().default("http://localhost:4445"),
    AUTH_URL: z.string().default("http://localhost:4002"),
  },
  shared: {
    GRAPHQL_ENDPOINT: z.string().default("http://localhost:4002/graphql"),
  },
  runtimeEnv: {
    AUTH_URL: process.env.AUTH_URL,
    HYDRA_ADMIN_URL: process.env.HYDRA_ADMIN_URL,
    GRAPHQL_ENDPOINT: process.env.GRAPHQL_ENDPOINT,
  },
});
