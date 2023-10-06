import { GraphQLEnumValueConfigMap } from "graphql"

import { GT } from "@/graphql/index"

export const priceRangeValues = [
  "ONE_DAY",
  "ONE_WEEK",
  "ONE_MONTH",
  "ONE_YEAR",
  "FIVE_YEARS",
] as const

const PriceGraphRange = GT.Enum({
  name: "PriceGraphRange",
  description: "The range for the X axis in the BTC price graph",
  values: priceRangeValues.reduce<GraphQLEnumValueConfigMap>((acc, curr) => {
    acc[curr] = {}
    return acc
  }, {}),
})

export default PriceGraphRange
