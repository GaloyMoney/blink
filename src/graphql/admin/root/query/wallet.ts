import { Wallets } from "@app"
import { GT } from "@graphql/index"
import IWallet from "@graphql/types/abstract/wallet"
import WalletId from "@graphql/types/scalar/wallet-id"

const WalletQuery = GT.Field({
  type: GT.NonNull(IWallet),
  args: {
    walletId: { type: GT.NonNull(WalletId) },
  },
  resolve: async (_, { walletId }) => {
    const wallet = await Wallets.getWallet(walletId)
    return wallet
  },
})

export default WalletQuery
