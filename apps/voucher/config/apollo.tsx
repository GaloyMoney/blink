"use client"
import { ApolloLink, HttpLink, split } from "@apollo/client"
import {
  ApolloNextAppProvider,
  NextSSRInMemoryCache,
  NextSSRApolloClient,
  SSRMultipartLink,
} from "@apollo/experimental-nextjs-app-support/ssr"
import { RetryLink } from "@apollo/client/link/retry"
import { onError } from "@apollo/client/link/error"
import { getMainDefinition } from "@apollo/client/utilities"
import { GraphQLWsLink } from "@apollo/client/link/subscriptions"
import { createClient } from "graphql-ws"

import { env } from "@/env"

const { NEXT_PUBLIC_GALOY_URL, NEXT_PUBLIC_LOCAL_URL, NEXT_PUBLIC_WS_URL } = env

function makeClient() {
  const httpLinkMainnet = new HttpLink({
    uri: NEXT_PUBLIC_GALOY_URL,
  })

  const httpLinkLocal = new HttpLink({
    uri: `${NEXT_PUBLIC_LOCAL_URL}/api/graphql`,
  })

  const wsLink = new GraphQLWsLink(
    createClient({
      url: NEXT_PUBLIC_WS_URL,
      retryAttempts: 12,
      connectionParams: {},
      shouldRetry: (errOrCloseEvent) => {
        console.warn({ errOrCloseEvent }, "entering shouldRetry function for websocket")
        return true
      },
    }),
  )

  const errorLink = onError(({ graphQLErrors, networkError }) => {
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
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      )
    },
    wsLink,
    ApolloLink.from([
      errorLink,
      retryLink,
      ApolloLink.split(
        (operation) => operation.getContext().endpoint === "GALOY",
        httpLinkMainnet,
        httpLinkLocal,
      ),
    ]),
  )

  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link:
      typeof window === "undefined"
        ? ApolloLink.from([new SSRMultipartLink({ stripDefer: true }), link])
        : link,
  })
}

export default function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const client = makeClient()
  return (
    <ApolloNextAppProvider makeClient={() => client}>{children}</ApolloNextAppProvider>
  )
}
