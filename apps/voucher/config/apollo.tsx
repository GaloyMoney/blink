"use client"
import { ApolloLink, HttpLink } from "@apollo/client"
import {
  ApolloNextAppProvider,
  NextSSRInMemoryCache,
  NextSSRApolloClient,
  SSRMultipartLink,
} from "@apollo/experimental-nextjs-app-support/ssr"
import { RetryLink } from "@apollo/client/link/retry"
import { onError } from "@apollo/client/link/error"

function makeClient({
  coreGqlUrl,
  voucherUrl,
}: {
  coreGqlUrl: string
  voucherUrl: string
}) {
  const httpLinkMainnet = new HttpLink({
    uri: coreGqlUrl,
  })

  const httpLinkLocal = new HttpLink({
    uri: `${voucherUrl}/api/graphql`,
  })

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

  const link = ApolloLink.from([
    errorLink,
    retryLink,
    ApolloLink.split(
      (operation) => operation.getContext().endpoint === "GALOY",
      httpLinkMainnet,
      httpLinkLocal,
    ),
  ])

  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link:
      typeof window === "undefined"
        ? ApolloLink.from([new SSRMultipartLink({ stripDefer: true }), link])
        : link,
  })
}

export default function ApolloWrapper({
  config,
  children,
}: {
  config: {
    coreGqlUrl: string
    voucherUrl: string
  }
  children: React.ReactNode
}) {
  const client = makeClient(config)
  return (
    <ApolloNextAppProvider makeClient={() => client}>{children}</ApolloNextAppProvider>
  )
}
