import { getCoreClient } from "@/services/core"
import { fetchByCardId } from "@/services/db/card"
import { fetchByK1 } from "@/services/db/payment"
import { gql } from "graphql-request"

import { NextRequest, NextResponse } from "next/server"

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
  const { walletId } = card

  let result: LnInvoicePaymentSendMutation
  try {
    result = await client.request<LnInvoicePaymentSendMutation>({
      document: lnInvoicePaymentSendMutation,
      variables: { input: { walletId, paymentRequest: pr } },
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
