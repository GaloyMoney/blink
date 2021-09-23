import { GT } from "@graphql/index"
import Username from "@graphql/types/scalar/username"
import WalletId from "@graphql/types/scalar/wallet-id"

import * as Users from "@app/users"

const UserWalletIdQuery = GT.Field({
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

    const walletPublicId = await Users.getWalletPublicIdFromUsername(username)

    if (walletPublicId instanceof Error) {
      throw walletPublicId
    }

    return walletPublicId
  },
})

export default UserWalletIdQuery
