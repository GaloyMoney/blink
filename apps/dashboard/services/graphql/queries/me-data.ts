import { gql } from "@apollo/client"

import { apollo } from ".."
import { MeDocument, MeQuery } from "../generated"

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
        callbackPortalUrl
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

export async function fetchUserDataForSession({ token }: { token: string }) {
  const client = apollo(token)
  try {
    const data = await client.query<MeQuery>({
      query: MeDocument,
    })
    return data
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
