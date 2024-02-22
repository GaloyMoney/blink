import { gql } from "@apollo/client"

import { apollo } from ".."
import { ApiKeysDocument, ApiKeysQuery } from "../generated"

gql`
  query ApiKeys {
    me {
      apiKeys {
        id
        name
        createdAt
        revoked
        expired
        lastUsedAt
        expiresAt
        readOnly
        scopes
      }
    }
  }
`

export async function apiKeys(token: string) {
  const client = apollo(token).getClient()

  try {
    const { data } = await client.query<ApiKeysQuery>({
      query: ApiKeysDocument,
    })
    return data.me?.apiKeys || []
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
