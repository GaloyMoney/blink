import { GT } from "@/graphql/index"

import { Levels } from "@/config"

import AccountLevel from "@/graphql/shared/types/scalar/account-level"

const AllLevelsQuery = GT.Field({
  type: GT.NonNullList(AccountLevel),
  resolve: () => {
    return Levels
  },
})

export default AllLevelsQuery
