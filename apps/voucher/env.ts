import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    ESCROW_API_KEY: z.string().default(""),
    PG_CON: z
      .string()
      .default("postgres://user:password@localhost:5430/voucher?sslmode=disable"),

    // HYDRA and next-auth
    CLIENT_ID: z.string().default("CLIENT_ID"),
    CLIENT_SECRET: z.string().default("CLIENT_SECRET"),
    HYDRA_PUBLIC: z.string().default("http://localhost:4444"),
    NEXTAUTH_URL: z.string().default("http://localhost:3006"),
    NEXTAUTH_SECRET: z.string().default("secret"),

    // PUBLIC URLs
    CORE_URL: z.string().default("http://localhost:4455/graphql"),
    VOUCHER_URL: z.string().default("http://localhost:3006"),

    // fees
    PLATFORM_FEES_IN_PPM: z.number().default(10000),
  },
  runtimeEnv: {
    CORE_URL: process.env.CORE_URL,
    VOUCHER_URL: process.env.VOUCHER_URL,
    PLATFORM_FEES_IN_PPM: process.env.PLATFORM_FEES_IN_PPM,

    ESCROW_API_KEY: process.env.ESCROW_API_KEY,
    PG_CON: process.env.PG_CON,

    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    HYDRA_PUBLIC: process.env.HYDRA_PUBLIC,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
})
