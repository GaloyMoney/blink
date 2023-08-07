import { GT } from "@graphql/index"

const ExchangeCurrencyUnit = GT.Enum({
  name: "ExchangeCurrencyUnit",
  values: {
    BTCSAT: {},
    USDCENT: {},
  },
})

export default ExchangeCurrencyUnit
