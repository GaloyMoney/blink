import { gql } from "@apollo/client"

import { apolloClient } from "../.."

import {
  IntraLedgerBtcPaymentSendDocument,
  IntraLedgerBtcPaymentSendMutation,
} from "../../generated"

gql`
  mutation IntraLedgerBtcPaymentSend($input: IntraLedgerPaymentSendInput!) {
    intraLedgerPaymentSend(input: $input) {
      errors {
        code
        message
      }
      status
    }
  }
`

export async function intraLedgerBtcPaymentSend({
  amount,
  memo,
  recipientWalletId,
  walletId,
}: {
  amount: number
  memo?: string
  recipientWalletId: string
  walletId: string
}) {
  const client = await apolloClient.authenticated()
  try {
    const { data } = await client.mutate<IntraLedgerBtcPaymentSendMutation>({
      mutation: IntraLedgerBtcPaymentSendDocument,
      variables: {
        input: {
          amount,
          memo,
          recipientWalletId,
          walletId,
        },
      },
    })
    return data
  } catch (error) {
    console.error("Error executing mutation: IntraLedgerBtcPaymentSend ", error)
    if (error instanceof Error) {
      console.error("Error : ", error)
      return new Error(error.message)
    } else {
      //TODO define error types
      console.error("Unknown Error")
      return new Error("Unknown error")
    }
  }
}
