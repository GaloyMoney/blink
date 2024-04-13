import { gql } from "@apollo/client"

import { apollo } from "../../client"

import {
  IntraLedgerUsdPaymentSendDocument,
  IntraLedgerUsdPaymentSendMutation,
} from "@/lib/graphql/generated"

gql`
  mutation intraLedgerUsdPaymentSend($input: IntraLedgerUsdPaymentSendInput!) {
    intraLedgerUsdPaymentSend(input: $input) {
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

export async function intraLedgerUsdPaymentSend({
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
}): Promise<Error | IntraLedgerUsdPaymentSendMutation> {
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
    if (!data) {
      return new Error("No data returned from IntraLedgerUsdPaymentSendMutation")
    }

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
