import { gql } from "@apollo/client"

import { apollo } from "../.."
import {
  IntraLedgerUsdPaymentSendDocument,
  IntraLedgerUsdPaymentSendMutation,
} from "../../generated"

gql`
  mutation intraLedgerUsdPaymentSend($input: IntraLedgerUsdPaymentSendInput!) {
    intraLedgerUsdPaymentSend(input: $input) {
      errors {
        code
        message
      }
      status
    }
  }
`

export async function intraLedgerUsdPaymentSend({
  token,
  amount,
  memo,
  recipientWalletId,
  walletId,
}: {
  token: string
  amount: number
  memo?: string
  recipientWalletId: string
  walletId: string
}) {
  const client = apollo(token).getClient()
  try {
    const { data } = await client.mutate<IntraLedgerUsdPaymentSendMutation>({
      mutation: IntraLedgerUsdPaymentSendDocument,
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
    console.error("Error executing mutation: intraLedgerUsdPaymentSend ==> ", error)
    if (error instanceof Error) {
      console.error("Error : ", error)
      return new Error(error.message)
    } else {
      console.error("Unknown Error")
      return new Error("Unknown error")
    }
  }
}
