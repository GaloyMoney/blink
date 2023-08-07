import { GT } from "@graphql/index"

import WalletCurrency from "../../../shared/types/scalar/wallet-currency"

const GlobalSettings = GT.Object({
  name: "GlobalSettings",
  fields: () => ({
    // Need to have Galoy Base Currency type here instead
    baseCurrency: { type: GT.NonNull(WalletCurrency) },
    depositFeePercentage: { type: GT.NonNull(GT.Float) },
  }),
})

export default GlobalSettings
