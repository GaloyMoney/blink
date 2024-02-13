import { NextRequest, NextResponse } from "next/server"

import { gql } from "@apollo/client"

import { apollo } from "@/services/core"
import { TransactionsDocument, TransactionsQuery } from "@/services/core/generated"
import { fetchByCardId } from "@/services/db/card"

gql`
  query transactions($first: Int, $after: String) {
    me {
      defaultAccount {
        defaultWalletId
        transactions(first: $first, after: $after) {
          ...TransactionList
        }
      }
    }
  }

  fragment TransactionList on TransactionConnection {
    pageInfo {
      hasNextPage
    }
    edges {
      cursor
      node {
        __typename
        id
        status
        direction
        memo
        createdAt
        settlementAmount
        settlementFee
        settlementDisplayAmount
        settlementDisplayFee
        settlementDisplayCurrency
        settlementCurrency
        settlementPrice {
          base
          offset
        }
        initiationVia {
          __typename
          ... on InitiationViaIntraLedger {
            counterPartyWalletId
            counterPartyUsername
          }
          ... on InitiationViaLn {
            paymentHash
          }
          ... on InitiationViaOnChain {
            address
          }
        }
        settlementVia {
          __typename
          ... on SettlementViaIntraLedger {
            counterPartyWalletId
            counterPartyUsername
          }
          ... on SettlementViaLn {
            preImage
          }
          ... on SettlementViaOnChain {
            transactionHash
          }
        }
      }
    }
  }
`

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  const card = await fetchByCardId(id)
  if (!card) {
    // TODO: error management?
    return NextResponse.json([])
  }

  const client = apollo(card.token).getClient()

  const data = await client.query<TransactionsQuery>({
    query: TransactionsDocument,
  })

  const transactions = data.data.me?.defaultAccount.transactions?.edges?.map(
    (element) => element.node,
  )

  return NextResponse.json(transactions)
}
