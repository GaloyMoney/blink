import { gql } from "@apollo/client"

import { apollo } from ".."
import { ApiKeysDocument, ApiKeysQuery } from "../generated"

gql`
  query ApiKeys {
    me {
      defaultAccount {
        ... on ConsumerAccount {
          apiKeys {
            id
            name
            createdAt
            expiration
          }
        }
      }
    }
  }
`

export async function apiKeys(token: string) {
  const client = apollo(token).getClient()

  try {
    const data = await client.query<ApiKeysQuery>({
      query: ApiKeysDocument,
    })
    return data.data.me?.defaultAccount.apiKeys || []
  } catch (err) {
    if (err instanceof Error) {
      console.error("error", err)
      throw new Error(err.message)
    } else {
      console.error("Unknown error")
      throw new Error("Unknown error")
    }
  }
}
