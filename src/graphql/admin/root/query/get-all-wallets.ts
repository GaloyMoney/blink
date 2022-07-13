import { GT } from "@graphql/index"
import WalletCurrency from "@graphql/types/scalar/wallet-currency"
import IWallet from "@graphql/types/abstract/wallet"
import { Wallets } from "@app"

const WalletsQuery = GT.Field({
  type: GT.NonNullList(IWallet),
  args: {
    walletCurrency: { type: GT.NonNull(WalletCurrency) },
  },
  resolve: async (_, { walletCurrency }) => {
    if (walletCurrency instanceof Error) throw walletCurrency
    const wallets = await Wallets.getAllWallets(walletCurrency)
    if (wallets instanceof Error) {
      throw wallets
    }
    return wallets
  },
})

export default WalletsQuery
