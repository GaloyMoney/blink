import { GT } from "@graphql/index"

import AllLevelsQuery from "./root/query/all-levels"
import UserDetailsByPhoneQuery from "./root/query/user-details-by-phone"
import UserDetailsByUsernameQuery from "./root/query/user-details-by-username"

const QueryType = new GT.Object({
  name: "Query",
  fields: () => ({
    allLevels: AllLevelsQuery,
    userDetailsByPhone: UserDetailsByPhoneQuery,
    userDetailsByUsername: UserDetailsByUsernameQuery,
  }),
})

export default QueryType
