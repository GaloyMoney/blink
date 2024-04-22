import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    CORE_URL: z.string().default("http://localhost:4455/graphql"),
  },
  client: {
    NEXT_PUBLIC_MAP_API_KEY: z.string().default(""),
  },
  runtimeEnv: {
    CORE_URL: process.env.CORE_URL,
    NEXT_PUBLIC_MAP_API_KEY: process.env.NEXT_PUBLIC_MAP_API_KEY,
  },
})
