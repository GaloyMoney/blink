import { gql } from "@apollo/client"

import { apollo } from "@/app/ssr-client"
import { MeDocument, MeQuery } from "@/lib/graphql/generated"

gql`
  query me {
    me {
      id
      username
      defaultAccount {
        displayCurrency
      }
    }
  }
`

export async function fetchUserData({ token }: { token: string }) {
  const client = apollo.authenticated(token).getClient()

  try {
    const data = await client.query<MeQuery>({
      query: MeDocument,
    })
    return data
  } catch (err) {
    if (err instanceof Error) {
      console.error("error", err)
      return new Error(err.message)
    } else {
      console.error("Unknown error")
      return new Error("Unknown error")
    }
  }
}
