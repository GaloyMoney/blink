import { HttpLink } from "@apollo/client"
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc"
import {
  NextSSRApolloClient,
  NextSSRInMemoryCache,
} from "@apollo/experimental-nextjs-app-support/ssr"

import { env } from "@/env"

type ClientOptions = {
  token?: string
}

const createApolloClient = (options?: ClientOptions) => {
  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link: new HttpLink({
      uri: env.CORE_GQL_URL_INTRANET,
      fetchOptions: { cache: "no-store" },
      headers: {
        ...(options?.token ? { ["Oauth2-Token"]: options.token } : {}),
      },
    }),
  })
}

export const apollo = {
  authorized: (token: string) =>
    registerApolloClient(() => createApolloClient({ token })),
  unauthorized: () => registerApolloClient(() => createApolloClient()),
}
