import { GT } from "@graphql/index"

import { levels } from "@config"

import AccountLevel from "@graphql/types/scalar/account-level"

const AllLevelsQuery = GT.Field({
  type: GT.NonNullList(AccountLevel),
  resolve: () => {
    return levels
  },
})

export default AllLevelsQuery
