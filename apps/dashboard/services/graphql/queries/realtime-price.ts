import { gql } from "@apollo/client"

import { RealtimePriceDocument, RealtimePriceQuery } from "../generated"
import { apollo } from ".."

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

export async function getRealtimePriceQuery(token: string) {
  const client = apollo(token).getClient()

  try {
    const data = await client.query<RealtimePriceQuery>({
      query: RealtimePriceDocument,
    })
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
