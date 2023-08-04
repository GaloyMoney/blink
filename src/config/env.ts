import { createEnv } from "@t3-oss/env-core"
import { ZodError, z } from "zod"

export const env = createEnv({
  onValidationError: (error: ZodError) => {
    console.error("❌ Invalid environment variables:", error.flatten().fieldErrors)
    throw new Error("Invalid environment variables")
  },

  server: {
    COMMITHASH: z.string().default("dev"),
    BUILDTIME: z.string().min(1),
    HELMREVISION: z.string().min(1),

    LOGLEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace"])
      .default("info"),

    KRATOS_PG_CON: z.string().url(),
    OATHKEEPER_HOST: z.string().min(1),
    OATHKEEPER_DECISION_PORT: z.string().min(4),
    GALOY_API_PORT: z.string().default("4012"),
    GALOY_ADMIN_PORT: z.string().default("4001"),
    NETWORK: z.enum(["mainnet", "testnet", "signet", "regtest"]),

    PRICE_SERVER_PORT: z.string().default("3325"),
    PRICE_SERVER_HOST: z.string().default("localhost"),

    TWILIO_ACCOUNT_SID: z.string().min(1),
    TWILIO_AUTH_TOKEN: z.string().min(1),
    TWILIO_VERIFY_SERVICE_ID: z.string().min(1),

    KRATOS_PUBLIC_API: z.string().url(),
    KRATOS_ADMIN_API: z.string().url(),
    KRATOS_MASTER_USER_PASSWORD: z.string().min(1),
    KRATOS_CALLBACK_API_KEY: z.string().min(1),

    BRIA_HOST: z.string().min(1),
    BRIA_PORT: z.string().min(1),
    BRIA_API_KEY: z.string().min(1),

    GEETEST_ID: z.string().min(1).optional(),
    GEETEST_KEY: z.string().min(1).optional(),

    MONGODB_CON: z.string().url(),

    GOOGLE_APPLICATION_CREDENTIALS_IS_SET: z.boolean().default(false),
  },

  runtimeEnvStrict: {
    COMMITHASH: process.env.COMMITHASH,
    BUILDTIME: process.env.BUILDTIME,
    HELMREVISION: process.env.HELMREVISION,

    LOGLEVEL: process.env.LOGLEVEL,

    KRATOS_PG_CON: process.env.KRATOS_PG_CON,
    OATHKEEPER_HOST: process.env.OATHKEEPER_HOST,
    OATHKEEPER_DECISION_PORT: process.env.OATHKEEPER_DECISION_PORT,
    GALOY_API_PORT: process.env.GALOY_API_PORT,
    GALOY_ADMIN_PORT: process.env.GALOY_ADMIN_PORT,
    NETWORK: process.env.NETWORK,
    PRICE_SERVER_PORT: process.env.PRICE_SERVER_PORT,
    PRICE_SERVER_HOST: process.env.PRICE_SERVER_HOST,

    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_VERIFY_SERVICE_ID: process.env.TWILIO_VERIFY_SERVICE_ID,

    KRATOS_PUBLIC_API: process.env.KRATOS_PUBLIC_API,
    KRATOS_ADMIN_API: process.env.KRATOS_ADMIN_API,
    KRATOS_MASTER_USER_PASSWORD: process.env.KRATOS_MASTER_USER_PASSWORD,
    KRATOS_CALLBACK_API_KEY: process.env.KRATOS_CALLBACK_API_KEY,

    BRIA_HOST: process.env.BRIA_HOST,
    BRIA_PORT: process.env.BRIA_PORT,
    BRIA_API_KEY: process.env.BRIA_API_KEY,

    GEETEST_ID: process.env.GEETEST_ID,
    GEETEST_KEY: process.env.GEETEST_KEY,

    MONGODB_CON: process.env.MONGODB_CON,

    GOOGLE_APPLICATION_CREDENTIALS_IS_SET: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },
})
