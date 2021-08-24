import { GT } from "@graphql/index"

const PriceGraphRange = new GT.Enum({
  name: "PriceGraphRange",
  description: "The range for the X axis in the BTC price graph",
  values: {
    ONE_DAY: {},
    ONE_WEEK: {},
    ONE_MONTH: {},
    ONE_YEAR: {},
    FIVE_YEARS: {},
  },
})

export default PriceGraphRange
