import { Wallets } from "@/app"
import { CouldNotUnsetPhoneFromUserError } from "@/domain/errors"
import { mapError } from "@/graphql/error-map"
import { GT } from "@/graphql/index"
import Phone from "@/graphql/shared/types/scalar/phone"
import WalletCurrency from "@/graphql/shared/types/scalar/wallet-currency"
import PublicWallet from "@/graphql/public/types/object/public-wallet"
import { UsersRepository, AccountsRepository } from "@/services/mongoose"

const DefaultWalletByPhoneNumberQuery = GT.Field({
  type: GT.NonNull(PublicWallet),
  args: {
    phone: {
      type: GT.NonNull(Phone),
    },
    walletCurrency: { type: WalletCurrency },
  },
  resolve: async (_, args) => {
    const { phoneNumber, walletCurrency } = args

    if (phoneNumber instanceof Error) {
      throw phoneNumber
    }

    const user = await UsersRepository().findByPhone(phoneNumber)
    if (user instanceof Error) {
      throw mapError(user)
    }

    const account = await AccountsRepository().findByUserId(user.id)
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
      throw mapError(new CouldNotUnsetPhoneFromUserError(phoneNumber))
    }

    return wallet
  },
})

export default DefaultWalletByPhoneNumberQuery
