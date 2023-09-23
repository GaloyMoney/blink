import { NextRequest, NextResponse } from "next/server"

import { FetchResult, gql } from "@apollo/client"

import { fetchByCardId } from "@/services/db/card"
import { fetchByK1 } from "@/services/db/payment"
import { apollo } from "@/services/core"
import {
  LnInvoicePaymentSendDocument,
  LnInvoicePaymentSendMutation,
} from "@/services/core/generated"

gql`
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

  const client = apollo(card.token).getClient()
  const { walletId } = card

  let result: FetchResult<LnInvoicePaymentSendMutation>
  try {
    result = await client.mutate<LnInvoicePaymentSendMutation>({
      mutation: LnInvoicePaymentSendDocument,
      variables: { input: { walletId, paymentRequest: pr } },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { status: "ERROR", reason: "payment failed" },
      { status: 400 },
    )
  }

  if (result.data?.lnInvoicePaymentSend.status === "SUCCESS") {
    return NextResponse.json({ status: "OK" })
  } else {
    return NextResponse.json(
      {
        status: "ERROR",
        reason: `payment failed: ${result.data?.lnInvoicePaymentSend.errors[0].message}`,
      },
      { status: 400 },
    )
  }
}
