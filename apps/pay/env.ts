import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    CORE_GQL_URL_INTRANET: z.string().default("http://localhost:4455/graphql"), // Use intranet URL to preserve tracing headers
    PAY_URL: z.string().default("http://localhost:3002"),
    NOSTR_PUBKEY: z.string().optional(),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_MASTER_NAME: z.string().optional(),
    REDIS_0_DNS: z.string().optional(),
    REDIS_1_DNS: z.string().optional(),
    REDIS_2_DNS: z.string().optional(),
  },
  // DO NOT USE THESE, EXCEPT FOR LOCAL DEVELOPMENT
  client: {
    NEXT_PUBLIC_CORE_GQL_URL: z.string().optional(),
    NEXT_PUBLIC_CORE_GQL_WEB_SOCKET_URL: z.string().optional(),
    NEXT_PUBLIC_PAY_DOMAIN: z.string().optional(),
  },
  runtimeEnv: {
    CORE_GQL_URL_INTRANET: process.env.CORE_GQL_URL_INTRANET,
    NEXT_PUBLIC_CORE_GQL_URL: process.env.NEXT_PUBLIC_CORE_GQL_URL,
    PAY_URL: process.env.PAY_URL,
    NEXT_PUBLIC_CORE_GQL_WEB_SOCKET_URL: process.env.NEXT_PUBLIC_CORE_GQL_WEB_SOCKET_URL,
    NEXT_PUBLIC_PAY_DOMAIN: process.env.NEXT_PUBLIC_PAY_DOMAIN,
    NOSTR_PUBKEY: process.env.NOSTR_PUBKEY, // Optional but required for Nostr Zaps
    REDIS_PASSWORD: process.env.REDIS_PASSWORD, // Optional but required for Nostr Zaps
    REDIS_MASTER_NAME: process.env.REDIS_MASTER_NAME, // Optional but required for Nostr Zaps
    REDIS_0_DNS: process.env.REDIS_0_DNS, // Optional but required for Nostr Zaps
    REDIS_1_DNS: process.env.REDIS_1_DNS, // Optional but required for Nostr Zaps
    REDIS_2_DNS: process.env.REDIS_2_DNS, // Optional but required for Nostr Zaps
  },
})
