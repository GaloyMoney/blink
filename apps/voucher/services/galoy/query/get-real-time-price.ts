import { ApolloClient, gql } from "@apollo/client"

import { RealtimePriceDocument, RealtimePriceQuery } from "@/lib/graphql/generated"

gql`
  query RealtimePrice($currency: DisplayCurrency) {
    realtimePrice(currency: $currency) {
      btcSatPrice {
        base
        offset
      }
      denominatorCurrency
      id
      timestamp
      usdCentPrice {
        base
        offset
      }
    }
  }
`

export async function getRealtimePriceQuery({
  client,
}: {
  client: ApolloClient<unknown>
}): Promise<Error | RealtimePriceQuery> {
  try {
    const { data } = await client.query<RealtimePriceQuery>({
      query: RealtimePriceDocument,
    })

    if (!data) {
      return new Error("No data found")
    }

    return data
  } catch (err) {
    if (err instanceof Error) {
      console.error("error", err)
      return new Error(err.message)
    } else {
      console.error("Unknown error in GetRealtimePriceQuery")
      return new Error("Unknown error")
    }
  }
}
