import { Currency } from "@/lib/graphql/generated"

export const defaultCurrencyMetadata: Currency = {
  id: "USD",
  flag: "🇺🇸",
  name: "US Dollar",
  symbol: "$",
  fractionDigits: 2,
  __typename: "Currency",
}
