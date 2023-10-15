import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    CORE_URL: z.string().default("http://localhost:4002/graphql"),
    CLIENT_ID: z.string().default("CLIENT_ID"),
    CLIENT_SECRET: z.string().default("CLIENT_SECRET"),
    WELL_KNOWN_OPENID_URL: z
      .string()
      .default("http://127.0.0.1:4444/.well-known/openid-configuration"),
    NEXTAUTH_URL: z
      .string()
      .default(
        "https://c890-2405-201-301c-5b67-89d6-bd56-6afb-6294.ngrok-free.app"
      ),
    NEXTAUTH_SECRET: z.string().default("thisismysecret"),
  },
  runtimeEnv: {
    CORE_URL: process.env.CORE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    WELL_KNOWN_OPENID_URL: process.env.WELL_KNOWN_OPENID_URL,
  },
});
