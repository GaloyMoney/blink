import { gql } from "@apollo/client"

import { apollo } from ".."
import {
  GetFirstTransactionsDocument,
  GetFirstTransactionsQuery,
  GetPaginatedTransactionsDocument,
  GetPaginatedTransactionsQuery,
} from "../generated"

// TODO remove not used fields
gql`
  query GetPaginatedTransactions($first: Int, $after: String, $before: String) {
    me {
      id
      defaultAccount {
        transactions(first: $first, after: $after, before: $before) {
          edges {
            cursor
            node {
              createdAt
              direction
              id
              memo
              settlementAmount
              settlementCurrency
              settlementDisplayAmount
              settlementDisplayCurrency
              settlementDisplayFee
              settlementFee
              settlementVia {
                ... on SettlementViaIntraLedger {
                  counterPartyUsername
                  counterPartyWalletId
                }
                ... on SettlementViaLn {
                  paymentSecret
                  preImage
                }
                ... on SettlementViaOnChain {
                  transactionHash
                  vout
                }
              }
              status
              settlementPrice {
                base
                currencyUnit
                formattedAmount
                offset
              }
              initiationVia {
                ... on InitiationViaIntraLedger {
                  counterPartyUsername
                  counterPartyWalletId
                }
                ... on InitiationViaOnChain {
                  address
                }
                ... on InitiationViaLn {
                  paymentHash
                }
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }
    }
  }
`

gql`
  query GetFirstTransactions($first: Int) {
    me {
      id
      defaultAccount {
        transactions(first: $first) {
          edges {
            cursor
            node {
              createdAt
              direction
              id
              memo
              settlementAmount
              settlementCurrency
              settlementDisplayAmount
              settlementDisplayCurrency
              settlementDisplayFee
              settlementFee
              settlementVia {
                ... on SettlementViaIntraLedger {
                  counterPartyUsername
                  counterPartyWalletId
                }
                ... on SettlementViaLn {
                  paymentSecret
                  preImage
                }
                ... on SettlementViaOnChain {
                  transactionHash
                  vout
                }
              }
              status
              settlementPrice {
                base
                currencyUnit
                formattedAmount
                offset
              }
              initiationVia {
                ... on InitiationViaIntraLedger {
                  counterPartyUsername
                  counterPartyWalletId
                }
                ... on InitiationViaOnChain {
                  address
                }
                ... on InitiationViaLn {
                  paymentHash
                }
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }
    }
  }
`

export async function fetchFirstTransactions({
  token,
  first,
}: {
  token: string
  first: number
}) {
  const client = apollo(token).getClient()

  try {
    const data = await client.query<GetFirstTransactionsQuery>({
      query: GetFirstTransactionsDocument,
      variables: { first },
    })
    return data.data.me?.defaultAccount.transactions
  } catch (err) {
    console.error("error in getting Transaction details", err)
    if (err instanceof Error) {
      throw new Error(err.message)
    }
    throw new Error("Unknown error")
  }
}

export async function fetchPaginatedTransactions({
  token,
  first,
  cursor,
  direction,
}: {
  token: string
  first: number
  cursor: string | null
  direction: "next" | "previous"
}) {
  const client = apollo(token).getClient()

  let variables: {
    first: number
    after?: string | null
    before?: string | null
  }

  if (direction === "next") {
    variables = { first, after: cursor }
  } else if (direction === "previous") {
    variables = { first, before: cursor }
  } else {
    throw new Error("Invalid direction provided. Use 'next' or 'previous'.")
  }

  try {
    const data = await client.query<GetPaginatedTransactionsQuery>({
      query: GetPaginatedTransactionsDocument,
      variables,
    })
    return data.data.me?.defaultAccount.transactions
  } catch (err) {
    console.error("error in fetchPaginatedTransactions ", err)
    if (err instanceof Error) {
      throw new Error(err.message)
    }
    throw new Error("Unknown error")
  }
}
