import { GT } from "@graphql/index"

import { User } from "@services/mongoose/schema"

import UserDetails from "@graphql/admin/types/object/user"
import WalletName from "@graphql/types/scalar/wallet-name"

const UserDetailsByWalletNameQuery = GT.Field({
  type: GT.NonNull(UserDetails),
  args: {
    walletName: { type: GT.NonNull(WalletName) },
  },
  resolve: async (parent, { walletName }) => {
    if (walletName instanceof Error) {
      throw walletName
    }

    const user = await User.getUserByUsername(walletName)
    if (!user) {
      throw new Error("User not found")
    }

    return user
  },
})

export default UserDetailsByWalletNameQuery
