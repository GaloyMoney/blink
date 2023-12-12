import { Wallets } from "@/app"
import { CouldNotFindWalletFromUsernameAndCurrencyError } from "@/domain/errors"
import { mapError } from "@/graphql/error-map"
import { GT } from "@/graphql/index"
import Username from "@/graphql/shared/types/scalar/username"
import WalletCurrency from "@/graphql/shared/types/scalar/wallet-currency"
import PublicWallet from "@/graphql/public/types/object/public-wallet"
import { AccountsRepository } from "@/services/mongoose"

const AccountDefaultWalletQuery = GT.Field({
  type: GT.NonNull(PublicWallet),
  args: {
    username: {
      type: GT.NonNull(Username),
    },
    walletCurrency: { type: WalletCurrency },
  },
  resolve: async (_, args) => {
    const { username, walletCurrency } = args

    if (username instanceof Error) {
      throw username
    }

    const account = await AccountsRepository().findByUsername(username)
    if (account instanceof Error) {
      throw mapError(account)
    }

    const wallets = await Wallets.listWalletsByAccountId(account.id)
    if (wallets instanceof Error) {
      throw mapError(wallets)
    }

    if (!walletCurrency) {
      return wallets.find((wallet) => wallet.id === account.defaultWalletId)
    }

    const wallet = wallets.find((wallet) => wallet.currency === walletCurrency)
    if (!wallet) {
      throw mapError(new CouldNotFindWalletFromUsernameAndCurrencyError(username))
    }

    return wallet
  },
})

export default AccountDefaultWalletQuery
