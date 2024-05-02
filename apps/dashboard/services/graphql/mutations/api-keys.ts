import { gql } from "@apollo/client"

import { apolloClient } from ".."
import {
  ApiKeyCreateDocument,
  ApiKeyCreateMutation,
  ApiKeyRevokeDocument,
  ApiKeyRevokeMutation,
  Scope,
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
        scopes
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
        scopes
      }
    }
  }
`

export async function createApiKey({
  name,
  expireInDays,
  scopes,
}: {
  name: string
  expireInDays: number | null
  scopes: Scope[]
}) {
  const client = await apolloClient.authenticated()
  try {
    const { data } = await client.mutate<ApiKeyCreateMutation>({
      mutation: ApiKeyCreateDocument,
      variables: { input: { name, expireInDays, scopes } },
    })
    return data
  } catch (error) {
    console.error("Error executing mutation: apiKeyCreate ==> ", error)
    throw new Error("Error in apiKeyCreate")
  }
}

export async function revokeApiKey({ id }: { id: string }) {
  const client = await apolloClient.authenticated()
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
