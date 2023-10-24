import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    CORE_URL: z.string().default("http://localhost:4002/graphql"),
    CLIENT_ID: z.string().default("CLIENT_ID"),
    CLIENT_SECRET: z.string().default("CLIENT_SECRET"),
    HYDRA_PUBLIC: z.string().default("http://127.0.0.1:4444"),
    NEXTAUTH_URL: z.string().default(""),
    NEXTAUTH_SECRET: z.string().default("thisismysecret"),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default("http://localhost:4318"),
  },
  runtimeEnv: {
    CORE_URL: process.env.CORE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    HYDRA_PUBLIC: process.env.HYDRA_PUBLIC,
    OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  },
})
