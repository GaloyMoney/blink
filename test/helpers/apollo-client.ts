import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  from,
  HttpLink,
  split,
  NormalizedCacheObject,
} from "@apollo/client/core"
import { WebSocketLink } from "@apollo/client/link/ws"
import { getMainDefinition } from "@apollo/client/utilities"
import fetch from "cross-fetch"
import { Observable, SubscriptionClient } from "subscriptions-transport-ws"
import ws from "ws"

export const createApolloClient = (
  authToken?: string,
  port = 4002,
  graphqlPath = "/graphql",
  graphqlSubscriptionPath = "/graphql",
): { apolloClient: ApolloClient<NormalizedCacheObject>; disposeClient: () => void } => {
  const cache = new InMemoryCache()

  const authLink = new ApolloLink((operation, forward) => {
    operation.setContext(({ headers }: { headers: Record<string, string> }) => ({
      headers: {
        authorization: authToken ? `Bearer ${authToken}` : "",
        ...headers,
      },
    }))
    return forward(operation)
  })

  const httpLink = new HttpLink({ uri: `http://localhost:${port}${graphqlPath}`, fetch })

  const subscriptionClient = new SubscriptionClient(
    `ws://localhost:${port}${graphqlSubscriptionPath}`,
    {
      reconnect: true,
      connectionParams: {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      },
    },
    ws,
  )

  const wsLink = new WebSocketLink(subscriptionClient)

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query)
      return (
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      )
    },
    wsLink,
    from([authLink, httpLink]),
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

  const disposeClient = () => {
    apolloClient.clearStore()
    apolloClient.stop()
    subscriptionClient.close()
  }

  return {
    apolloClient,
    disposeClient,
  }
}

export const getSubscriptionNext = (subscription: Observable<any>): Promise<any> => {
  return new Promise((resolve, reject) => {
    subscription.subscribe({ next: resolve, error: reject })
  })
}
