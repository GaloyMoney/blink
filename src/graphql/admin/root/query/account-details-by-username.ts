import { GT } from "@graphql/index"

import GraphQLAccount from "@graphql/admin/types/object/account"
import Username from "@graphql/types/scalar/username"
import { Admin } from "@app"

const AccountDetailsByUsernameQuery = GT.Field({
  type: GT.NonNull(GraphQLAccount),
  args: {
    username: { type: GT.NonNull(Username) },
  },
  resolve: async (parent, { username }) => {
    if (username instanceof Error) {
      throw username
    }

    const account = await Admin.getAccountByUsername(username)
    if (account instanceof Error) {
      throw account
    }

    return account
  },
})

export default AccountDetailsByUsernameQuery
