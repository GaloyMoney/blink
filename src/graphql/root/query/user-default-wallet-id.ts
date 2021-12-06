import { GT } from "@graphql/index"
import Username from "@graphql/types/scalar/username"
import WalletId from "@graphql/types/scalar/wallet-id"
import { AccountsRepository } from "@services/mongoose"

const AccountDefaultWalletIdQuery = GT.Field({
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

    const walletPublicId = account.defaultWalletId
    return walletPublicId
  },
})

export default AccountDefaultWalletIdQuery
