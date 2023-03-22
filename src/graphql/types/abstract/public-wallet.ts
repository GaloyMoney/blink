import { GT } from "@graphql/index"

import WalletCurrency from "../scalar/wallet-currency"
import DisplayCurrency from "../scalar/display-currency"

const IPublicWallet = GT.Object<Wallet>({
  name: "PublicWallet",
  description:
    "A public view of a generic wallet which stores value in one of our supported currencies.",
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    walletCurrency: {
      type: GT.NonNull(WalletCurrency),
      resolve: (source) => source.currency,
    },
    displayCurrency: {
      type: GT.NonNull(DisplayCurrency),
    },
  }),
})

export default IPublicWallet
