import { ApolloClient, gql } from "@apollo/client"

import { MeDocument, MeQuery } from "@/lib/graphql/generated"

gql`
  query me {
    me {
      createdAt
      id
      language
      phone
      defaultAccount {
        defaultWalletId
        displayCurrency
        id
        level
        wallets {
          accountId
          balance
          id
          pendingIncomingBalance
          walletCurrency
        }
      }
      totpEnabled
      username
      email {
        address
        verified
      }
    }
  }
`

export async function fetchUserData({
  client,
}: {
  client: ApolloClient<unknown>
}): Promise<MeQuery | Error> {
  try {
    const { data } = await client.query<MeQuery>({
      query: MeDocument,
    })

    if (!data) {
      return new Error("No data found")
    }

    return data
  } catch (error) {
    if (error instanceof Error) {
      console.error("error in fetchUserData", error)
      return new Error(error.message)
    } else {
      console.error("Unknown error in fetchUserData")
      return new Error("Unknown error")
    }
  }
}
