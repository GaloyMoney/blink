import { GT } from "@graphql/index"

import GraphQLUser from "@graphql/admin/types/object/user"
import Username from "@graphql/types/scalar/username"
import { getUserByUsername } from "@app/admin"

const UserDetailsByUsernameQuery = GT.Field({
  type: GT.NonNull(GraphQLUser),
  args: {
    username: { type: GT.NonNull(Username) },
  },
  resolve: async (parent, { username }) => {
    if (username instanceof Error) {
      throw username
    }

    const user = await getUserByUsername(username)
    if (user instanceof Error) {
      throw user
    }

    return user
  },
})

export default UserDetailsByUsernameQuery
