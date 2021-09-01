import { GT } from "@graphql/index"

import { levels } from "@config/app"

import AccountLevel from "@graphql/admin/types/scalar/account-level"

const AllLevelsQuery = GT.Field({
  type: GT.NonNullList(AccountLevel),
  resolve: () => {
    return levels
  },
})

export default AllLevelsQuery
