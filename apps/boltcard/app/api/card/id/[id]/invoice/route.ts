import { gql } from "@apollo/client"

import { NextRequest, NextResponse } from "next/server"

import { apollo } from "@/services/core"
import {
  LnNoAmountInvoiceCreateDocument,
  LnNoAmountInvoiceCreateMutation,
} from "@/services/core/generated"
import { fetchByCardId } from "@/services/db/card"

gql`
  mutation lnNoAmountInvoiceCreate($input: LnNoAmountInvoiceCreateInput!) {
    lnNoAmountInvoiceCreate(input: $input) {
      errors {
        message
        __typename
      }
      invoice {
        paymentHash
        paymentRequest
        paymentSecret
        __typename
      }
      __typename
    }
  }
`

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const cardId = params.id
  const card = await fetchByCardId(cardId)

  if (!card) {
    return NextResponse.json(
      { status: "ERROR", reason: "card not found" },
      { status: 400 },
    )
  }

  const { walletId, token, username } = card
  console.log({ walletId, token, username }, "card data")

  const memo = `refill ${username}`

  const client = apollo(token).getClient()

  try {
    const data = await client.mutate<LnNoAmountInvoiceCreateMutation>({
      mutation: LnNoAmountInvoiceCreateDocument,
      variables: { input: { walletId, memo } },
    })

    return NextResponse.json({
      status: "OK",
      data: data.data?.lnNoAmountInvoiceCreate.invoice?.paymentRequest,
    })
  } catch (err) {
    let message = ""
    if (err instanceof Error) {
      message = err.message
    }

    return NextResponse.json(
      { status: "ERROR", reason: "impossible to create invoice", message },
      { status: 400 },
    )
  }
}
