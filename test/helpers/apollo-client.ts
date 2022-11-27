import {
  ApolloClient,
  ApolloLink,
  from,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
  split,
} from "@apollo/client/core"
import { WebSocketLink } from "@apollo/client/link/ws"
import { getMainDefinition } from "@apollo/client/utilities"
import { SubscriptionClient } from "subscriptions-transport-ws"
import ws from "ws"

import { onError } from "@apollo/client/link/error"
import { baseLogger } from "@services/logger"

import USER_LOGIN from "../e2e/servers/graphql-main-server/mutations/user-login.gql"
import USER_UPDATE_MUTATION from "../e2e/servers/graphql-main-server/mutations/user-update-username.gql"

export const localIpAddress = "127.0.0.1" as IpAddress

export type ApolloTestClientConfig = {
  authToken?: SessionToken
  graphqlUrl: string
  graphqlSubscriptionUrl: string
}

export const defaultTestClientConfig = (
  authToken?: SessionToken,
): ApolloTestClientConfig => {
  const OATHKEEPER_HOST = process.env.OATHKEEPER_HOST ?? "oathkeeper"
  const OATHKEEPER_PORT = process.env.OATHKEEPER_PORT ?? "4002"

  return {
    authToken,
    graphqlUrl: `http://${OATHKEEPER_HOST}:${OATHKEEPER_PORT}/graphql`,
    graphqlSubscriptionUrl: `ws://${OATHKEEPER_HOST}:${OATHKEEPER_PORT}/graphql`,
  }
}

export const createApolloClient = (
  testClientConfg: ApolloTestClientConfig,
): { apolloClient: ApolloClient<NormalizedCacheObject>; disposeClient: () => void } => {
  const { authToken, graphqlUrl, graphqlSubscriptionUrl } = testClientConfg
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

  const subscriptionClient = new SubscriptionClient(
    graphqlSubscriptionUrl,
    {
      connectionParams: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    },
    ws,
  )

  const wsLink = new WebSocketLink(subscriptionClient)

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

export const promisifiedSubscription = (subscription) => {
  return new Promise((resolve, reject) => {
    subscription.subscribe({ next: resolve, error: reject })
  })
}

export const loginFromPhoneAndCode = async ({
  phone,
  code,
}: {
  phone: PhoneNumber
  code: PhoneCode
}): Promise<ApolloClient<NormalizedCacheObject>> => {
  let apolloClient: ApolloClient<NormalizedCacheObject>,
    disposeClient: () => void = () => null

  let authToken: SessionToken
  {
    ;({ apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig()))
    const input = { phone, code }
    const result = await apolloClient.mutate({
      mutation: USER_LOGIN,
      variables: { input },
    })

    authToken = result.data.userLogin.authToken
    expect(authToken).toBeDefined()
    disposeClient()
  }

  {
    // Create a new authenticated client
    ;({ apolloClient, disposeClient } = createApolloClient(
      defaultTestClientConfig(authToken),
    ))

    return apolloClient
  }
}

export const updateUsername = async ({
  username,
  apolloClient,
}: {
  apolloClient: ApolloClient<NormalizedCacheObject>
  username: Username
}) => {
  const input = { username }

  await apolloClient.mutate({
    mutation: USER_UPDATE_MUTATION,
    variables: { input },
  })
}
