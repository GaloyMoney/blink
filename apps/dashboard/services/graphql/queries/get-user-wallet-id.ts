import { gql } from "@apollo/client"

import {
  GetDefaultWalletByUsernameDocument,
  GetDefaultWalletByUsernameQuery,
} from "../generated"
import { apollo } from ".."

gql`
  query GetDefaultWalletByUsername($username: Username!) {
    accountDefaultWallet(username: $username) {
      id
      walletCurrency
    }
  }
`
export async function getWalletDetailsByUsername(token: string, username: string) {
  const client = apollo(token).getClient()

  try {
    const data = await client.query<GetDefaultWalletByUsernameQuery>({
      query: GetDefaultWalletByUsernameDocument,
      variables: { username },
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
