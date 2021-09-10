import { GT } from "@graphql/index"

const ExchangeCurrencyUnit = new GT.Enum({
  name: "ExchangeCurrencyUnit",
  values: {
    BTCSAT: {},
    USDCENT: {},
  },
})

export default ExchangeCurrencyUnit
