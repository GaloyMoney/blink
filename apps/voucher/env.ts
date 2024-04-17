import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"
import dotenv from "dotenv"
dotenv.config({ path: "../.env" })

export const env = createEnv({
  server: {
    ESCROW_TOKEN: z.string().default(""),
    PG_CON: z
      .string()
      .default("postgres://user:password@localhost:5430/voucher?sslmode=disable"),

    // HYDRA and next-auth
    CLIENT_ID: z.string().default("CLIENT_ID"),
    CLIENT_SECRET: z.string().default("CLIENT_SECRET"),
    HYDRA_PUBLIC: z.string().default("http://localhost:4444"),
    NEXTAUTH_URL: z.string().default("http://localhost:3006"),
    NEXTAUTH_SECRET: z.string().default("secret"),
  },
  shared: {
    NEXT_PUBLIC_GALOY_URL: z.string().default("http://localhost:4455/graphql"),
    NEXT_PUBLIC_LOCAL_URL: z.string().default("http://localhost:3006"),
    NEXT_PUBLIC_WS_URL: z.string().default("ws://localhost:4000/graphql"),
  },
  runtimeEnv: {
    NEXT_PUBLIC_GALOY_URL: process.env.NEXT_PUBLIC_GALOY_URL,
    NEXT_PUBLIC_LOCAL_URL: process.env.NEXT_PUBLIC_LOCAL_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,

    ESCROW_TOKEN: process.env.ESCROW_TOKEN,
    PG_CON: process.env.PG_CON,

    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    HYDRA_PUBLIC: process.env.HYDRA_PUBLIC,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
})
