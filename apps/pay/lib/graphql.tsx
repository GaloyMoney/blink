import * as React from "react"
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  split,
  HttpLink,
  ApolloLink,
} from "@apollo/client"
import { getMainDefinition } from "@apollo/client/utilities"
import { GraphQLWsLink } from "@apollo/client/link/subscriptions"
import { RetryLink } from "@apollo/client/link/retry"
import { onError } from "@apollo/client/link/error"

import { createClient } from "graphql-ws"

import { env } from "../env"

const httpLink = new HttpLink({
  uri: env.NEXT_PUBLIC_CORE_GQL_URL,
})

const wsLink = new GraphQLWsLink(
  createClient({
    url: env.NEXT_PUBLIC_CORE_GQL_WEB_SOCKET_URL,
    retryAttempts: 12,
    connectionParams: {},
    shouldRetry: (errOrCloseEvent) => {
      console.warn({ errOrCloseEvent }, "entering shouldRetry function for websocket")
      // TODO: understand how the backend is closing the connection
      // for instance during a new version rollout or k8s upgrade
      //
      // in the meantime:
      // returning true instead of the default 'Any non-`CloseEvent`'
      // to force createClient to attempt a reconnection
      return true
    },
    // Voluntary not using: webSocketImpl: WebSocket
    // seems react native already have an implement of the websocket?
    //
    // TODO: implement keepAlive and reconnection?
    // https://github.com/enisdenjo/graphql-ws/blob/master/docs/interfaces/client.ClientOptions.md#keepalive
  }),
)

const errorLink = onError(({ graphQLErrors, networkError }) => {
  // graphqlErrors should be managed locally
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) => {
      if (message === "PersistedQueryNotFound") {
        console.log(`[GraphQL info]: Message: ${message}, Path: ${path}}`, {
          locations,
        })
      } else {
        console.warn(`[GraphQL error]: Message: ${message}, Path: ${path}}`, {
          locations,
        })
      }
    })
  // only network error are managed globally
  if (networkError) {
    console.log(`[Network error]: ${networkError}`)
  }
})

const retryLink = new RetryLink({
  attempts: {
    max: 5,
  },
})

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === "OperationDefinition" && definition.operation === "subscription"
    )
  },
  wsLink,
  ApolloLink.from([errorLink, retryLink, httpLink]),
)

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
})

export default ({ children }: { children: React.ReactNode }) => (
  <ApolloProvider client={client}>{children}</ApolloProvider>
)
