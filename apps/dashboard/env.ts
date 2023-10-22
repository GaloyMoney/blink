import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    CORE_URL: z.string().default("http://localhost:4455/graphql"),
    NEXTAUTH_URL: z.string().default(""),
    NEXTAUTH_SECRET: z.string().default("secret"),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default("http://localhost:4318"),
    CLIENT_ID: z.string().default("CLIENT_ID"),
    CLIENT_SECRET: z.string().default("CLIENT_SECRET"),
    CLIENT_ID_APP_API_KEY: z.string().default("CLIENT_ID"),
    CLIENT_SECRET_APP_API_KEY: z.string().default("CLIENT_SECRET"),
    HYDRA_PUBLIC: z.string().default("http://localhost:4444"),
    HYDRA_ADMIN: z.string().default("http://localhost:4445"),
  },
  runtimeEnv: {
    CORE_URL: process.env.CORE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    CLIENT_ID_APP_API_KEY: process.env.CLIENT_ID_APP_API_KEY,
    CLIENT_SECRET_APP_API_KEY: process.env.CLIENT_SECRET_APP_API_KEY,
    HYDRA_PUBLIC: process.env.HYDRA_PUBLIC,
    OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    HYDRA_ADMIN: process.env.HYDRA_ADMIN,
  },
})
