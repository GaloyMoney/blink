import { GT } from "@graphql/index"

const ExchangeCurrencyUnit = GT.Enum({
  name: "ExchangeCurrencyUnit",
  values: {
    BTCSAT: {},
  },
})

export default ExchangeCurrencyUnit
