import { GT } from "@graphql/index"

import GraphQLAccount from "@graphql/admin/types/object/account"
import { mapError } from "@graphql/error-map"

import { Admin } from "@app"

const AccountDetailsByAccountId = GT.Field({
  type: GT.NonNull(GraphQLAccount),
  args: {
    // TODO: type for AccountId when AccountId / AccountUuid are properly exposed
    accountId: { type: GT.NonNullID },
  },
  resolve: async (_, { accountId }) => {
    if (accountId instanceof Error) {
      throw accountId
    }

    const account = await Admin.getAccountByAccountUuid(accountId)
    if (account instanceof Error) {
      throw mapError(account)
    }

    return account
  },
})

export default AccountDetailsByAccountId
