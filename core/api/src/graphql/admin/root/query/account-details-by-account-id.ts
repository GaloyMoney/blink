import { GT } from "@/graphql/index"

import AuditedAccount from "@/graphql/admin/types/object/account"
import { mapError } from "@/graphql/error-map"

import { Admin } from "@/app"

const AccountDetailsByAccountId = GT.Field({
  args: {
    accountId: { type: GT.NonNullID },
  },
  type: GT.NonNull(AuditedAccount),
  resolve: async (_, { accountId }) => {
    if (accountId instanceof Error) {
      throw accountId
    }

    const account = await Admin.getAccountByAccountId(accountId)
    if (account instanceof Error) {
      throw mapError(account)
    }

    return account
  },
})

export default AccountDetailsByAccountId
