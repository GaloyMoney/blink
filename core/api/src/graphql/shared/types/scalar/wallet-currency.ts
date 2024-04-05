import { GT } from "@/graphql/index"

const WalletCurrency = GT.Enum({
  name: "WalletCurrency",
  values: {
    BTC: {},
    USD: {},
  },
})

export default WalletCurrency
