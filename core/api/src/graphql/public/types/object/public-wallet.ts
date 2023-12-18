import WalletCurrency from "../../../shared/types/scalar/wallet-currency"

import { GT } from "@/graphql/index"

const PublicWallet = GT.Object<Wallet>({
  name: "PublicWallet",
  description:
    "A public view of a generic wallet which stores value in one of our supported currencies.",
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    currency: {
      type: GT.NonNull(WalletCurrency),
    },
    walletCurrency: {
      type: GT.NonNull(WalletCurrency),
      resolve: (source) => source.currency,
      deprecationReason: "Shifting property to 'currency'",
    },
  }),
})

export default PublicWallet
