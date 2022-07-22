import { GT } from "@graphql/index"
import { Wallets } from "@app"
import WalletCurrency from "@graphql/types/scalar/wallet-currency"
import WalletId from "@graphql/types/scalar/wallet-id"

const AllWalletIdsQuery = GT.Field({
  type: GT.NonNullList(WalletId),
  args: {
    walletCurrency: { type: GT.NonNull(WalletCurrency) },
  },
  resolve: async (_, { walletCurrency }) => {
    return Wallets.getAllWalletIds(walletCurrency)
  },
})

export default AllWalletIdsQuery
