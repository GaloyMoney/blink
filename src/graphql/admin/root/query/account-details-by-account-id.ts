import { GT } from "@graphql/index"

import GraphQLAccount from "@graphql/admin/types/object/account"
import { mapError } from "@graphql/error-map"

import { Admin } from "@app"

const AccountDetailsByUsernameQuery = GT.Field({
  type: GT.NonNull(GraphQLAccount),
  args: {
    // TODO: type for AccountId
    accountId: { type: GT.NonNullID },
  },
  resolve: async (parent, { accountId }) => {
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

export default AccountDetailsByUsernameQuery
