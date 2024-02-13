import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client"
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc"

import { loadDevMessages, loadErrorMessages } from "@apollo/client/dev"

import { coreUrl } from "../config"

export const apollo = (token: string) =>
  registerApolloClient(() => {
    return new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink({
        headers: {
          authorization: `Bearer ${token}`,
        },
        uri: coreUrl,
        // you can disable result caching here if you want to
        // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
        fetchOptions: { cache: "no-store" },
      }),
    })
  })

// TODO: Adds messages only in a dev environment
loadDevMessages()
loadErrorMessages()
