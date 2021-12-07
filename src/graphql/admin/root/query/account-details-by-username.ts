import { GT } from "@graphql/index"

import GraphQLAccount from "@graphql/admin/types/object/account"
import Username from "@graphql/types/scalar/username"
import { getAccountByUsername } from "@app/admin"

const AccountDetailsByUsernameQuery = GT.Field({
  type: GT.NonNull(GraphQLAccount),
  args: {
    username: { type: GT.NonNull(Username) },
  },
  resolve: async (parent, { username }) => {
    if (username instanceof Error) {
      throw username
    }

    const account = await getAccountByUsername(username)
    if (account instanceof Error) {
      throw account
    }

    return account
  },
})

export default AccountDetailsByUsernameQuery
