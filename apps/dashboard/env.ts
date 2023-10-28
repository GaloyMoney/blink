import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    CORE_URL: z.string().default("http://localhost:4455/graphql"),
    CLIENT_ID: z.string().default("CLIENT_ID"),
    CLIENT_SECRET: z.string().default("CLIENT_SECRET"),
    HYDRA_PUBLIC: z.string().default("http://localhost:4444"),
    HYDRA_ADMIN: z.string().default("http://localhost:4445"),
    NEXTAUTH_URL: z.string().default(""),
    NEXTAUTH_SECRET: z.string().default("secret"),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default("http://localhost:4318"),
  },
  runtimeEnv: {
    CORE_URL: process.env.CORE_URL,
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    HYDRA_PUBLIC: process.env.HYDRA_PUBLIC,
    HYDRA_ADMIN: process.env.HYDRA_ADMIN,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  },
})
