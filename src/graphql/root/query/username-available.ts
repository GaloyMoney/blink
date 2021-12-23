import { GT } from "@graphql/index"
import Username from "@graphql/types/scalar/username"

import { Users } from "@app"

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

    const available = await Users.usernameAvailable(username)

    if (available instanceof Error) {
      throw available
    }

    return available
  },
})

export default UsernameAvailableQuery
