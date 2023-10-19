import { env } from "@/env";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc";

export const apollo = (token: string, request: Request) =>
  registerApolloClient(() => {
    return new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink({
        headers: {
          ["Oauth2-Token"]: token,
          "x-real-ip": request.headers.get("x-real-ip") || "",
          "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
        },
        uri: env.CORE_URL,
        fetchOptions: { cache: "no-store" },
      }),
    });
  });
