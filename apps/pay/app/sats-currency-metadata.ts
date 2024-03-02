import { Currency } from "@/lib/graphql/generated"

export const satCurrencyMetadata: Currency = {
  __typename: "Currency",
  id: "SAT",
  flag: "₿",
  name: "Bitcoin sats",
  symbol: "sats",
  fractionDigits: 0,
}
