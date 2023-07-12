import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  from,
  HttpLink,
  split,
  NormalizedCacheObject,
  FetchResult,
} from "@apollo/client/core"
import { getMainDefinition, Observable } from "@apollo/client/utilities"

import { onError } from "@apollo/client/link/error"
import { GraphQLWsLink } from "@apollo/client/link/subscriptions"
import { baseLogger } from "@services/logger"

import { createClient } from "graphql-ws"
import WebSocket from "ws"
import { Subscription } from "zen-observable-ts"

import { OATHKEEPER_HOST, OATHKEEPER_PORT } from "test/helpers/env"

export const localIpAddress = "127.0.0.1" as IpAddress

export type ApolloTestClientConfig = {
  authToken?: SessionToken
  graphqlUrl: string
  graphqlSubscriptionUrl: string
}

export const defaultTestClientConfig = (
  authToken?: SessionToken,
): ApolloTestClientConfig => {
  return {
    authToken,
    graphqlUrl: `http://${OATHKEEPER_HOST}:${OATHKEEPER_PORT}/graphql`,
    graphqlSubscriptionUrl: `ws://${OATHKEEPER_HOST}:${OATHKEEPER_PORT}/graphqlws`,
  }
}

export const adminTestClientConfig = (
  authToken?: SessionToken,
): ApolloTestClientConfig => {
  return {
    authToken,
    graphqlUrl: `http://${OATHKEEPER_HOST}:${OATHKEEPER_PORT}/admin/graphql`,
    graphqlSubscriptionUrl: "",
  }
}

export const createApolloClient = (
  testClientConfig: ApolloTestClientConfig,
): {
  apolloClient: ApolloClient<NormalizedCacheObject>
  disposeClient: () => Promise<void>
} => {
  const { authToken, graphqlUrl, graphqlSubscriptionUrl } = testClientConfig
  const cache = new InMemoryCache()

  const authLink = new ApolloLink((operation, forward) => {
    operation.setContext(({ headers }: { headers: Record<string, string> }) => ({
      headers: {
        "Authorization": authToken ? `Bearer ${authToken}` : "",
        "x-real-ip": localIpAddress,
        ...headers,
      },
    }))
    return forward(operation)
  })

  const httpLink = new HttpLink({ uri: graphqlUrl })

  const subscriptionClient = createClient({
    url: graphqlSubscriptionUrl,
    connectionParams: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    webSocketImpl: WebSocket,
  })

  const wsLink = new GraphQLWsLink(subscriptionClient)

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors)
      graphQLErrors.forEach(({ message, locations, path }) =>
        baseLogger.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        ),
      )
    if (networkError) baseLogger.error(`[Network error]: ${networkError}`)
  })

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query)
      return (
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      )
    },
    wsLink,
    from([errorLink, authLink, httpLink]),
  )

  const apolloClient = new ApolloClient({
    cache,
    link: splitLink,
    defaultOptions: {
      watchQuery: {
        errorPolicy: "all",
      },
      query: {
        errorPolicy: "all",
      },
      mutate: {
        errorPolicy: "all",
      },
    },
  })

  const disposeClient = async () => {
    apolloClient.clearStore()
    apolloClient.stop()
    subscriptionClient.terminate()
  }

  return {
    apolloClient,
    disposeClient,
  }
}

// it's kind of a hack because it's resuscribing to the same subscription
// and triggering a new subscribe() function on the server
// whereas a real client would just wait for next()
//
// also the backend currently send price on subscribe.
export const promisifiedSubscription = <T>(subscription: Observable<FetchResult<T>>) => {
  let sub: Subscription | undefined
  const promise = new Promise((resolve, reject) => {
    sub = subscription.subscribe({ next: resolve, error: reject })
  })

  return {
    promise,
    unsubscribe: () => {
      if (sub) {
        sub.unsubscribe()
        sub = undefined
      }
    },
  }
}
