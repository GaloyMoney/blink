import { GT } from "@graphql/index"

const WalletCurrency = new GT.Enum({
  name: "WalletCurrency",
  values: {
    BTC: {},
  },
})

export default WalletCurrency
