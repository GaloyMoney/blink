import { GT } from "@/graphql/index"

import AuditedAccount from "@/graphql/admin/types/object/account"
import { mapError } from "@/graphql/error-map"

import { Admin } from "@/app"

const AccountDetailsByAccountUuid = GT.Field({
  args: {
    accountUuid: { type: GT.NonNullID },
  },
  type: GT.NonNull(AuditedAccount),
  resolve: async (_, { accountUuid }) => {
    if (accountUuid instanceof Error) {
      throw accountUuid
    }

    const account = await Admin.getAccountByAccountUuid(accountUuid)
    if (account instanceof Error) {
      throw mapError(account)
    }

    return account
  },
})

export default AccountDetailsByAccountUuid
