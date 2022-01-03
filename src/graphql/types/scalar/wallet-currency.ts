import { GT } from "@graphql/index"

const WalletCurrency = GT.Enum({
  name: "WalletCurrency",
  values: {
    BTC: {},
  },
})

export default WalletCurrency
