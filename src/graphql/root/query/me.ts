import { GT } from "@graphql/index"

import { UserWithAccounts } from "@graphql/types/object/user"

const MeQuery = GT.Field({
  type: UserWithAccounts,
  resolve: async (_, __, { domainUser }) => {
    return domainUser
  },
})

export default MeQuery
