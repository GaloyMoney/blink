import { gql } from "@apollo/client"

import {
  GetDefaultWalletByUsernameDocument,
  GetDefaultWalletByUsernameQuery,
} from "../generated"
import { apolloClient } from ".."

gql`
  query GetDefaultWalletByUsername($username: Username!) {
    accountDefaultWallet(username: $username) {
      id
      walletCurrency
    }
  }
`
export async function getWalletDetailsByUsername({ username }: { username: string }) {
  const client = await apolloClient.authenticated()

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
