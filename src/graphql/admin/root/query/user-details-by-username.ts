import { GT } from "@graphql/index"

import GraphQLUser from "@graphql/admin/types/object/user"
import Username from "@graphql/types/scalar/username"

import { User } from "@services/mongoose/schema"

const UserDetailsByUsernameQuery = GT.Field({
  type: GT.NonNull(GraphQLUser),
  args: {
    username: { type: GT.NonNull(Username) },
  },
  resolve: async (parent, { username }) => {
    if (username instanceof Error) {
      throw username
    }

    const user = await User.getUserByUsername(username)
    if (!user) {
      throw new Error("User not found")
    }

    return user
  },
})

export default UserDetailsByUsernameQuery
