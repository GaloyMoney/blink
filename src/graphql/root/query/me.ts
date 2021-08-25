import User from "@graphql/types/object/user"
import * as Users from "@app/users"
import { GT } from "@graphql/index"

const MeQuery = GT.Field({
  type: User,
  resolve: async (_, __, { uid }) => {
    const user = await Users.getUser(uid)
    if (user instanceof Error) {
      throw user
    }
    return user
  },
})

export default MeQuery
