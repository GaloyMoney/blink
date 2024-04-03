import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"
import dotenv from "dotenv"
dotenv.config({ path: "../.env" })

export const env = createEnv({
  server: {
    ESCROW_TOKEN: z.string().default(""),
    PG_CON: z.string().default("postgres://user:password@localhost:5430/voucher"),
  },
  client: {
    NEXT_PUBLIC_GALOY_URL: z.string().default("api.staging.galoy.io"),
    NEXT_PUBLIC_LOCAL_URL: z
      .string()
      .default("https://a3f8-2405-201-301c-5ac6-9135-e4dc-ffb1-5e46.ngrok-free.app"),
  },
  shared: {
    // TODO remove this as no longer needed "BTC"
    NEXT_PUBLIC_ESCROW_WALLET_BTC: z.string().default(""),
    NEXT_PUBLIC_ESCROW_WALLET_USD: z
      .string()
      .default("a9f06793-078e-4fac-b125-5489de1f0442"),
  },
  runtimeEnv: {
    NEXT_PUBLIC_GALOY_URL: process.env.NEXT_PUBLIC_GALOY_URL,
    NEXT_PUBLIC_ESCROW_WALLET_BTC: process.env.NEXT_PUBLIC_ESCROW_WALLET_BTC,
    NEXT_PUBLIC_ESCROW_WALLET_USD: process.env.NEXT_PUBLIC_ESCROW_WALLET_USD,
    NEXT_PUBLIC_LOCAL_URL: process.env.NEXT_PUBLIC_LOCAL_URL,
    ESCROW_TOKEN: process.env.ESCROW_TOKEN,
    PG_CON: process.env.PG_CON,
  },
})
