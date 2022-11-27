import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core"

import USER_LOGIN from "../e2e/servers/graphql-main-server/mutations/user-login.gql"
import USER_UPDATE_MUTATION from "../e2e/servers/graphql-main-server/mutations/user-update-username.gql"

import { createApolloClient, defaultTestClientConfig } from "./apollo-client"

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
