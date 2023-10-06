import WalletCurrency from "../../../shared/types/scalar/wallet-currency"

import { GT } from "@/graphql/index"

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
  }),
})

export default IPublicWallet
