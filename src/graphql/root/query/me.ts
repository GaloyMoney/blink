import { GT } from "@graphql/index"

import { UserWithAccounts } from "@graphql/types/object/user"
import * as Users from "@app/users"

const MeQuery = GT.Field({
  type: UserWithAccounts,
  resolve: async (_, __, { uid }) => {
    const user = await Users.getUser(uid)
    if (user instanceof Error) {
      throw user
    }
    return user
  },
})

export default MeQuery
