import { env } from "@/env";
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  ApolloLink,
} from "@apollo/client";
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc";

const headerSettingLink = new ApolloLink((operation, forward) => {
  const request = operation.getContext().request;
  operation.setContext({
    headers: {
      "x-real-ip": request?.headers.get("x-real-ip") || "",
      "x-forwarded-for": request?.headers.get("x-forwarded-for") || "",
    },
  });
  return forward(operation);
});

export const apollo = (token: string, request: Request) =>
  registerApolloClient(() => {
    const httpLink = new HttpLink({
      headers: {
        ["Oauth2-Token"]: token,
      },
      uri: env.CORE_URL,
      fetchOptions: { cache: "no-store" },
    });

    const link = ApolloLink.from([headerSettingLink, httpLink]);
    return new ApolloClient({
      cache: new InMemoryCache(),
      link,
    });
  });
