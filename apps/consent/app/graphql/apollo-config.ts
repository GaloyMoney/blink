import { env } from "../../env";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export const graphQlClient = (authToken?: string) => {
  const httpLink = new HttpLink({
    uri: env.GRAPHQL_ENDPOINT,
    fetchOptions: { cache: "no-store" },
    headers: authToken ? { authorization: `Bearer ${authToken}` } : undefined,
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: httpLink,
  });
};
