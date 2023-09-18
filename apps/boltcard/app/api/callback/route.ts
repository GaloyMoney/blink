import { getCoreClient } from "@/services/core"
import { fetchByCardId } from "@/services/db/card"
import { fetchByK1 } from "@/services/db/payment"
import { gql } from "graphql-request"

import { NextRequest, NextResponse } from "next/server"

type GetUsdWalletIdQuery = {
  readonly me?: {
    readonly defaultAccount: {
      readonly id: string
      readonly defaultWalletId: string
      readonly wallets: ReadonlyArray<
        | {
            readonly id: string
            readonly walletCurrency: string
            readonly balance: number
          }
        | {
            readonly id: string
            readonly walletCurrency: string
            readonly balance: number
          }
      >
    }
  } | null
}

type LnInvoicePaymentSendMutation = {
  readonly __typename: "Mutation"
  readonly lnInvoicePaymentSend: {
    readonly __typename: "PaymentSendPayload"
    readonly status?: string | null
    readonly errors: ReadonlyArray<{
      readonly __typename: "GraphQLApplicationError"
      readonly message: string
    }>
  }
}

const getUsdWalletIdQuery = gql`
  query getUsdWalletId {
    me {
      defaultAccount {
        id
        defaultWalletId
        wallets {
          id
          walletCurrency
          balance
        }
      }
    }
  }
`

const lnInvoicePaymentSendMutation = gql`
  mutation lnInvoicePaymentSend($input: LnInvoicePaymentInput!) {
    lnInvoicePaymentSend(input: $input) {
      errors {
        message
      }
      status
    }
  }
`

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const k1 = searchParams.get("k1")
  const pr = searchParams.get("pr")

  if (!k1 || !pr) {
    return NextResponse.json(
      { status: "ERROR", reason: "missing k1 or pr" },
      { status: 400 },
    )
  }

  const payment = await fetchByK1(k1)
  if (!payment) {
    return NextResponse.json(
      { status: "ERROR", reason: "payment not found" },
      { status: 400 },
    )
  }

  const { cardId } = payment

  const card = await fetchByCardId(cardId)

  const client = getCoreClient(card.token)

  let data: GetUsdWalletIdQuery
  try {
    data = await client.request<GetUsdWalletIdQuery>(getUsdWalletIdQuery)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { status: "ERROR", reason: "issue fetching walletId" },
      { status: 400 },
    )
  }

  const wallets = data.me?.defaultAccount.wallets

  if (!wallets) {
    return NextResponse.json(
      { status: "ERROR", reason: "no wallets found" },
      { status: 400 },
    )
  }

  const usdWallet = wallets.find((wallet) => wallet.walletCurrency === "USD")
  const usdWalletId = usdWallet?.id

  console.log({ usdWallet, wallets })

  if (!usdWalletId) {
    return NextResponse.json(
      { status: "ERROR", reason: "no usd wallet found" },
      { status: 400 },
    )
  }

  let result: LnInvoicePaymentSendMutation
  try {
    result = await client.request<LnInvoicePaymentSendMutation>({
      document: lnInvoicePaymentSendMutation,
      variables: { input: { walletId: usdWalletId, paymentRequest: pr } },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { status: "ERROR", reason: "payment failed" },
      { status: 400 },
    )
  }

  if (result.lnInvoicePaymentSend.status === "SUCCESS") {
    return NextResponse.json({ status: "OK" })
  } else {
    return NextResponse.json(
      {
        status: "ERROR",
        reason: `payment failed: ${result.lnInvoicePaymentSend.errors[0].message}`,
      },
      { status: 400 },
    )
  }
}
