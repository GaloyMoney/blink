import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    GOOGLE_CLIENT_ID: z.string().min(1).default("googleId"),
    GOOGLE_CLIENT_SECRET: z.string().min(1).default("googleSecret"),
    GITHUB_CLIENT_ID: z.string().min(1).default("githubClientId"),
    GITHUB_CLIENT_SECRET: z.string().min(1).default("githubSecret"),
    ADMIN_CORE_API: z.string().url().default("http://localhost:4455/admin/graphql"),
    NEXTAUTH_URL: z.string().url().default("http://localhost:3004"),
    NEXTAUTH_SECRET: z.string().min(8).default("nextAuthSecret"),
    AUTHORIZED_EMAILS: z
      .string()
      .transform((x) => x.split(",").map((email) => email.trim()))
      .default("test@galoy.io"),
  },
  /*
   * Environment variables available on the client (and server).
   *
   * 💡 You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  client: {},
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    ADMIN_CORE_API: process.env.ADMIN_CORE_API,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    AUTHORIZED_EMAILS: process.env.AUTHORIZED_EMAILS,
  },
})
