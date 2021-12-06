import { GT } from "@graphql/index"
import Username from "@graphql/types/scalar/username"
import WalletId from "@graphql/types/scalar/wallet-id"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"

// FIXME: rename to AccountDefaultWalletIdQuery
const UserDefaultWalletIdQuery = GT.Field({
  type: GT.NonNull(WalletId),
  args: {
    username: {
      type: GT.NonNull(Username),
    },
  },
  resolve: async (_, args) => {
    const { username } = args

    if (username instanceof Error) {
      throw username
    }

    const account = await AccountsRepository().findByUsername(username)
    if (account instanceof Error) return account

    const wallet = await WalletsRepository().findById(account.defaultWalletId)
    if (wallet instanceof Error) return wallet

    const walletPublicId = wallet.publicId
    return walletPublicId
  },
})

export default UserDefaultWalletIdQuery
