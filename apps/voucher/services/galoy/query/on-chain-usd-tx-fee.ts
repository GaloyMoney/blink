import { ApolloClient, gql } from "@apollo/client"

import { OnChainUsdTxFeeDocument, OnChainUsdTxFeeQuery } from "@/lib/graphql/generated"

gql`
  query OnChainUsdTxFee(
    $address: OnChainAddress!
    $amount: CentAmount!
    $walletId: WalletId!
    $speed: PayoutSpeed!
  ) {
    onChainUsdTxFee(
      address: $address
      amount: $amount
      walletId: $walletId
      speed: $speed
    ) {
      amount
    }
  }
`

export async function onChainUsdTxFee({
  client,
  input: { address, amount, walletId, speed },
}: {
  client: ApolloClient<unknown>
  input: {
    address: string
    amount: number
    walletId: string
    speed: string
  }
}): Promise<OnChainUsdTxFeeQuery | Error> {
  try {
    const { data } = await client.query<OnChainUsdTxFeeQuery>({
      query: OnChainUsdTxFeeDocument,
      variables: {
        address,
        amount,
        walletId,
        speed,
      },
    })

    if (!data) {
      return new Error("No data found")
    }

    return data
  } catch (error) {
    if (error instanceof Error) {
      console.error("error in onChainUsdTxFee", error)
      return new Error(error.message)
    } else {
      console.error("Unknown error in onChainUsdTxFee")
      return new Error("Unknown error")
    }
  }
}
