import { ApolloClient, gql } from "@apollo/client"

import {
  OnChainUsdPaymentSendDocument,
  OnChainUsdPaymentSendMutation,
} from "@/lib/graphql/generated"

gql`
  mutation OnChainUsdPaymentSend($input: OnChainUsdPaymentSendInput!) {
    onChainUsdPaymentSend(input: $input) {
      errors {
        code
        message
      }
      status
    }
  }
`

export async function onChainUsdPaymentSend({
  client,
  input: { address, amount, memo, speed, walletId },
}: {
  client: ApolloClient<unknown>
  input: {
    address: string
    amount: number
    memo: string
    speed: string
    walletId: string
  }
}): Promise<Error | OnChainUsdPaymentSendMutation> {
  try {
    const { data } = await client.mutate<OnChainUsdPaymentSendMutation>({
      mutation: OnChainUsdPaymentSendDocument,
      variables: {
        input: {
          memo,
          address,
          amount,
          speed,
          walletId,
        },
      },
    })

    if (!data) {
      return new Error("No data returned from OnChainUsdPaymentSendMutation")
    }

    return data
  } catch (error) {
    console.error("Error in OnChainUsdPaymentSend ", error)
    if (error instanceof Error) {
      return new Error(error.message)
    } else {
      console.error("Unknown Error in OnChainUsdPaymentSend")
      return new Error("Unknown error")
    }
  }
}
