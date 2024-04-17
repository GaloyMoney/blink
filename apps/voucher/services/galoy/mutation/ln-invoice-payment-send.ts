import { ApolloClient, gql } from "@apollo/client"

import {
  LnInvoicePaymentSendDocument,
  LnInvoicePaymentSendMutation,
} from "@/lib/graphql/generated"

gql`
  mutation LnInvoicePaymentSend($input: LnInvoicePaymentInput!) {
    lnInvoicePaymentSend(input: $input) {
      errors {
        message
        code
      }
      status
      transaction {
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
        status
      }
    }
  }
`

export async function lnInvoicePaymentSend({
  client,
  input: { memo, paymentRequest, walletId },
}: {
  client: ApolloClient<unknown>
  input: {
    memo: string
    paymentRequest: string
    walletId: string
  }
}): Promise<Error | LnInvoicePaymentSendMutation> {
  try {
    const { data } = await client.mutate<LnInvoicePaymentSendMutation>({
      mutation: LnInvoicePaymentSendDocument,
      variables: {
        input: {
          memo,
          paymentRequest,
          walletId,
        },
      },
    })

    if (!data) {
      return new Error("No data returned from LnInvoicePaymentSendMutation")
    }

    return data
  } catch (error) {
    console.error("Error in LnInvoicePaymentSend ", error)
    if (error instanceof Error) {
      return new Error(error.message)
    } else {
      console.error("Unknown Error in LnInvoicePaymentSend")
      return new Error("Unknown error")
    }
  }
}
