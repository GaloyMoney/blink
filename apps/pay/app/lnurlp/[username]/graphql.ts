import {
  ApolloClient,
  ApolloLink,
  concat,
  gql,
  HttpLink,
  InMemoryCache,
} from "@apollo/client"

import { GRAPHQL_URL_INTERNAL } from "../../../lib/config"

const ipForwardingMiddleware = new ApolloLink((operation, forward) => {
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      "x-real-ip": operation.getContext()["x-real-ip"],
      "x-forwarded-for": operation.getContext()["x-forwarded-for"],
    },
  }))

  return forward(operation)
})

export const client = new ApolloClient({
  link: concat(
    ipForwardingMiddleware,
    new HttpLink({
      uri: GRAPHQL_URL_INTERNAL,
      fetchOptions: { cache: "no-store" },
    }),
  ),
  cache: new InMemoryCache(),
})

gql`
  query accountDefaultWallet($username: Username!, $walletCurrency: WalletCurrency!) {
    accountDefaultWallet(username: $username, walletCurrency: $walletCurrency) {
      __typename
      id
      walletCurrency
    }
  }
`
