import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    HYDRA_ADMIN_URL: z.string().default("http://localhost:4445"),
    CORE_AUTH_URL: z.string().default("http://localhost:4455/auth"),
  },
  shared: {
    GRAPHQL_ENDPOINT: z.string().default("http://localhost:4455/graphql"),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default("http://localhost:4318"),
    TRACING_SERVICE_NAME: z.string().default("consent"),
  },
  runtimeEnv: {
    CORE_AUTH_URL: process.env.CORE_AUTH_URL,
    HYDRA_ADMIN_URL: process.env.HYDRA_ADMIN_URL,
    GRAPHQL_ENDPOINT: process.env.GRAPHQL_ENDPOINT,
    OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    TRACING_SERVICE_NAME: process.env.TRACING_SERVICE_NAME,
  },
})
