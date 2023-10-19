import { env } from "../../env";
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  ApolloLink,
} from "@apollo/client";

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

export const graphQlClient = (authToken?: string, request?: Request) => {
  const httpLink = new HttpLink({
    uri: env.GRAPHQL_ENDPOINT,
    fetchOptions: { cache: "no-store" },
    headers: {
      ...(authToken ? { authorization: `Bearer ${authToken}` } : undefined),
    },
  });

  const link = ApolloLink.from([headerSettingLink, httpLink]);
  return new ApolloClient({
    cache: new InMemoryCache(),
    link,
  });
};
