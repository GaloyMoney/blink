import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core"

import { gql } from "apollo-server-core"

import { createApolloClient, defaultTestClientConfig } from "../helpers/apollo-client"

import { UserLoginDocument, UserUpdateUsernameDocument } from "test/e2e/generated"

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
      mutation: UserLoginDocument,
      variables: { input },
    })

    authToken = result.data.userLogin.authToken
    expect(authToken).not.toBeNull()
    expect(authToken.length).toBe(39)
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

gql`
  mutation userUpdateUsername($input: UserUpdateUsernameInput!) {
    userUpdateUsername(input: $input) {
      errors {
        __typename
        message
      }
      user {
        __typename
        id
        username
      }
    }
  }
`

export const updateUsername = async ({
  username,
  apolloClient,
}: {
  apolloClient: ApolloClient<NormalizedCacheObject>
  username: Username
}) => {
  const input = { username }

  await apolloClient.mutate({
    mutation: UserUpdateUsernameDocument,
    variables: { input },
  })
}
