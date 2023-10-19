import { env } from "../../env";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export const graphQlClient = (authToken?: string, request?: Request) => {
  const httpLink = new HttpLink({
    uri: env.GRAPHQL_ENDPOINT,
    fetchOptions: { cache: "no-store" },
    headers: {
      ...(authToken ? { authorization: `Bearer ${authToken}` } : undefined),
      "x-real-ip": request?.headers.get("x-real-ip") || "",
      "x-forwarded-for": request?.headers.get("x-forwarded-for") || "",
    },
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: httpLink,
  });
};
