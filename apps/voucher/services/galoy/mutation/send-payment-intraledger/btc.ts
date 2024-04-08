import { gql } from "@apollo/client"

import {
  IntraLedgerBtcPaymentSendDocument,
  IntraLedgerBtcPaymentSendMutation,
} from "@/lib/graphql/generated/index"
import { apollo } from "../../client"

gql`
  mutation IntraLedgerBtcPaymentSend($input: IntraLedgerPaymentSendInput!) {
    intraLedgerPaymentSend(input: $input) {
      errors {
        code
        message
      }
      status
      transaction {
        createdAt
        direction
        id
        settlementAmount
        settlementCurrency
        settlementDisplayAmount
        settlementDisplayCurrency
        settlementFee
        settlementDisplayFee
        settlementPrice {
          base
          offset
        }
        status
      }
    }
  }
`

export async function intraLedgerBtcPaymentSend({
  token,
  amount,
  memo,
  recipientWalletId,
  walletId,
}: {
  token: string
  amount: number
  memo: string
  recipientWalletId: string
  walletId: string
}): Promise<Error | IntraLedgerBtcPaymentSendMutation> {
  const client = apollo(token).getClient()
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

    if (!data) {
      return new Error("No data returned from IntraLedgerBtcPaymentSendMutation")
    }

    return data
  } catch (error) {
    console.error("Error in IntraLedgerBtcPaymentSend ", error)
    if (error instanceof Error) {
      return new Error(error.message)
    } else {
      console.error("Unknown Error in IntraLedgerBtcPaymentSend")
      return new Error("Unknown error")
    }
  }
}
