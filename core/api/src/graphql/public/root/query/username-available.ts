import { GT } from "@/graphql/index"
import Username from "@/graphql/shared/types/scalar/username"
import { mapError } from "@/graphql/error-map"

import { Accounts } from "@/app"

const UsernameAvailableQuery = GT.Field({
  type: GT.Boolean,
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

    const available = await Accounts.usernameAvailable(username)

    if (available instanceof Error) {
      throw mapError(available)
    }

    return available
  },
})

export default UsernameAvailableQuery
