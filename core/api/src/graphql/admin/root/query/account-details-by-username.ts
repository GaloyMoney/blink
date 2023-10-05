import { GT } from "@/graphql/index"

import AuditedAccount from "@/graphql/admin/types/object/account"
import Username from "@/graphql/shared/types/scalar/username"
import { mapError } from "@/graphql/error-map"

import { Admin } from "@/app"

const AccountDetailsByUsernameQuery = GT.Field({
  args: {
    username: { type: GT.NonNull(Username) },
  },
  type: GT.NonNull(AuditedAccount),
  resolve: async (parent, { username }) => {
    if (username instanceof Error) {
      throw username
    }

    const account = await Admin.getAccountByUsername(username)
    if (account instanceof Error) {
      throw mapError(account)
    }

    return account
  },
})

export default AccountDetailsByUsernameQuery
