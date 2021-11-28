import { GT } from "@graphql/index"
import Username from "@graphql/types/scalar/username"
import WalletId from "@graphql/types/scalar/wallet-id"

import * as Accounts from "@app/accounts"
import { CouldNotFindError } from "@domain/errors"
import { NotFoundError, UnknownClientError } from "@core/error"

// FIXME: rename to AccountDefaultWalletIdQuery
const UserDefaultWalletIdQuery = GT.Field({
  type: GT.NonNull(WalletId),
  args: {
    username: {
      type: GT.NonNull(Username),
    },
  },
  resolve: async (_, args, { logger }) => {
    const { username } = args

    if (username instanceof Error) {
      throw username
    }

    const walletPublicId = await Accounts.getWalletPublicIdFromUsername(username)

    if (walletPublicId instanceof CouldNotFindError) {
      throw new NotFoundError("User not found", { forwardToClient: true, logger })
    }

    if (walletPublicId instanceof Error) {
      throw new UnknownClientError("Something went wrong")
    }

    return walletPublicId
  },
})

export default UserDefaultWalletIdQuery
