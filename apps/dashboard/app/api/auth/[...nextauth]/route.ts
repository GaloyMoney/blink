import NextAuth, { AuthOptions } from "next-auth";
import { fetchUserData } from "@/services/graphql/queries/me-data";
import { env } from "@/env";
import { ApolloQueryResult } from "@apollo/client";
import { MeQuery } from "@/services/graphql/generated";

declare module "next-auth" {
  interface Profile {
    id: string;
  }
  interface Session {
    sub: string | null;
    accessToken: string;
    userData: ApolloQueryResult<MeQuery>;
  }
}

const type = "oauth" as const;
export const authOptions: AuthOptions = {
  providers: [
    {
      id: "blink",
      clientId: env.CLIENT_ID,
      clientSecret: env.CLIENT_SECRET,
      wellKnown: env.HYDRA_PUBLIC,
      authorization: {
        params: { scope: "offline transactions:read payments:send" },
      },
      idToken: false,
      name: "Blink",
      type,
      profile(profile) {
        return {
          id: profile.sub,
        };
      },
    },
  ],
  debug: true,
  secret: env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.expiresAt = account.expires_at;
        token.refreshToken = account.refresh_token;
        token.id = profile?.id;
      }
      return token;
    },
    async session({ session, token, user }) {
      const userData = await fetchUserData(token.accessToken as string);
      session.sub = token?.sub || null;
      session.accessToken = token.accessToken as string;
      session.userData = userData;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
