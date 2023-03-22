import { Wallets } from "@app"

import { DisplayCurrency } from "@domain/fiat"
import { CouldNotFindWalletFromUsernameAndCurrencyError } from "@domain/errors"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import Username from "@graphql/types/scalar/username"
import WalletCurrency from "@graphql/types/scalar/wallet-currency"
import PublicWallet from "@graphql/types/abstract/public-wallet"

import { AccountsRepository } from "@services/mongoose"

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

    const { displayCurrency, title, coordinates } = account
    const isBusiness = !!title && !!coordinates
    if (!walletCurrency) {
      return {
        ...wallets.find((wallet) => wallet.id === account.defaultWalletId),
        displayCurrency: isBusiness ? displayCurrency : DisplayCurrency.Usd,
        isBusiness,
      }
    }

    const wallet = wallets.find((wallet) => wallet.currency === walletCurrency)
    if (!wallet) {
      throw mapError(new CouldNotFindWalletFromUsernameAndCurrencyError(username))
    }

    return {
      ...wallet,
      displayCurrency: isBusiness ? displayCurrency : DisplayCurrency.Usd,
      isBusiness,
    }
  },
})

export default AccountDefaultWalletQuery
