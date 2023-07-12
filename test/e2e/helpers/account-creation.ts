import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core"

import { createApolloClient, defaultTestClientConfig } from "./apollo-client"

import { UserLoginDocument, UserLoginMutation } from "test/e2e/generated"

type ApolloClientAndDispose = {
  apolloClient: ApolloClient<NormalizedCacheObject>
  disposeClient: () => Promise<void>
  authToken: SessionToken
}

export const loginFromPhoneAndCode = async ({
  phone,
  code,
}: {
  phone: PhoneNumber
  code: PhoneCode
}): Promise<ApolloClientAndDispose> => {
  let apolloClient: ApolloClient<NormalizedCacheObject>,
    disposeClient: () => Promise<void>

  let authToken: SessionToken
  {
    ;({ apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig()))
    const input = { phone, code }
    const result = await apolloClient.mutate<UserLoginMutation>({
      mutation: UserLoginDocument,
      variables: { input },
    })

    const authTokenRaw = result?.data?.userLogin.authToken
    if (!authTokenRaw) throw new Error("No authTokenRaw")
    authToken = authTokenRaw as SessionToken
    expect(authToken).not.toBeNull()
    expect(authToken.length).toBe(39)
    disposeClient()
  }

  {
    // Create a new authenticated client
    ;({ apolloClient, disposeClient } = createApolloClient(
      defaultTestClientConfig(authToken),
    ))

    return { apolloClient, disposeClient, authToken }
  }
}
