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

import { setContext } from "@apollo/client/link/context"

import { getClientSideGqlConfig } from "@/config/config"

function makeClient({ authToken }: { authToken: string | undefined }) {
  const httpLink = new HttpLink({
    uri: getClientSideGqlConfig().coreGqlUrl,
    fetchOptions: { cache: "no-store" },
  })

  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        ...(authToken ? { ["Oauth2-Token"]: authToken } : {}),
      },
    }
  })

  const wsLink = new GraphQLWsLink(
    createClient({
      url: getClientSideGqlConfig().coreGqlWebSocketUrl,
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

  let arrayLink = [errorLink, retryLink, httpLink]
  if (authToken) {
    arrayLink = [authLink, ...arrayLink]
  }

  const link = split(
    ({ query }) => {
      const definition = getMainDefinition(query)
      return (
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      )
    },
    wsLink,
    ApolloLink.from(arrayLink),
  )

  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link:
      typeof window === "undefined"
        ? ApolloLink.from([
            new SSRMultipartLink({
              stripDefer: true,
            }),
            link,
          ])
        : link,
  })
}

type ApolloWrapperProps = {
  children: React.ReactNode
  authToken?: string
}

export function ApolloWrapper({ children, authToken }: ApolloWrapperProps) {
  const client = makeClient({ authToken })

  return (
    <ApolloNextAppProvider makeClient={() => client}>{children}</ApolloNextAppProvider>
  )
}
