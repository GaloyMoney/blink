import { GT } from "@graphql/index"
import { Wallets } from "@app"
import WalletId from "@graphql/types/scalar/wallet-id"

const AllWalletIdsQuery = GT.Field({
  type: GT.NonNullList(WalletId),
  resolve: async () => {
    const walletIds = await Wallets.getAllWalletIds()
    return walletIds
  },
})

export default AllWalletIdsQuery
