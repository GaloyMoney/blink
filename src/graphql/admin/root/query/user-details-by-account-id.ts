import { GT } from "@graphql/index"

import GraphQLUser from "@graphql/admin/types/object/user"
import { mapError } from "@graphql/error-map"

import { Admin } from "@app"

const UserDetailsByAccountId = GT.Field({
  type: GT.NonNull(GraphQLUser),
  args: {
    // TODO: type for AccountId when AccountId / AccountUUID are properly exposed
    accountId: { type: GT.NonNullID },
  },
  resolve: async (_, { accountId }) => {
    if (accountId instanceof Error) {
      throw accountId
    }

    const user = await Admin.getUserByAccountUuid(accountId)
    if (user instanceof Error) {
      throw mapError(user)
    }

    return user
  },
})

export default UserDetailsByAccountId
