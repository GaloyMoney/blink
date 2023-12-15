import { gql } from "@apollo/client"

import { apollo } from ".."
import {
  ApiKeyCreateDocument,
  ApiKeyCreateMutation,
  ApiKeyRevokeDocument,
  ApiKeyRevokeMutation,
} from "../generated"

gql`
  mutation ApiKeyCreate($input: ApiKeyCreateInput!) {
    apiKeyCreate(input: $input) {
      apiKey {
        id
        name
        createdAt
        revoked
        expired
        lastUsedAt
        expiresAt
      }
      apiKeySecret
    }
  }

  mutation ApiKeyRevoke($input: ApiKeyRevokeInput!) {
    apiKeyRevoke(input: $input) {
      apiKey {
        id
        name
        createdAt
        revoked
        expired
        lastUsedAt
        expiresAt
      }
    }
  }
`

export async function createApiKey(
  token: string,
  name: string,
  expireInDays: number | null,
  readOnly: boolean,
) {
  const client = apollo(token).getClient()
  try {
    const { data } = await client.mutate<ApiKeyCreateMutation>({
      mutation: ApiKeyCreateDocument,
      variables: { input: { name, expireInDays, readOnly } },
    })
    return data
  } catch (error) {
    console.error("Error executing mutation: apiKeyCreate ==> ", error)
    throw new Error("Error in apiKeyCreate")
  }
}

export async function revokeApiKey(token: string, id: string) {
  const client = apollo(token).getClient()
  try {
    const { data } = await client.mutate<ApiKeyRevokeMutation>({
      mutation: ApiKeyRevokeDocument,
      variables: { input: { id } },
    })
    return data
  } catch (error) {
    console.error("Error executing mutation: apiKeyRevoke ==> ", error)
    throw new Error("Error in apiKeyRevoke")
  }
}
