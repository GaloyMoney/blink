import { GT } from "@/graphql/index"

import AuditedAccount from "@/graphql/admin/types/object/account"
import { mapError } from "@/graphql/error-map"

import { Admin } from "@/app"

const AccountDetailsByUserId = GT.Field({
  args: {
    userId: { type: GT.NonNullID },
  },
  type: GT.NonNull(AuditedAccount),
  resolve: async (_, { userId }) => {
    if (userId instanceof Error) {
      throw userId
    }

    const account = await Admin.getAccountByUserId(userId)
    if (account instanceof Error) {
      throw mapError(account)
    }

    return account
  },
})

export default AccountDetailsByUserId
