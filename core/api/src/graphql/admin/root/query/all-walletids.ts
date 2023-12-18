import { GT } from "@/graphql/index"
import { Wallets } from "@/app"
import WalletCurrency from "@/graphql/shared/types/scalar/wallet-currency"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"

const ListWalletIdsQuery = GT.Field({
  type: GT.NonNullList(WalletId),
  args: {
    walletCurrency: { type: GT.NonNull(WalletCurrency) },
  },
  resolve: async (_, { walletCurrency }) => Wallets.listWalletIds(walletCurrency),
})

export default ListWalletIdsQuery
