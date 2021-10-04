import { GT } from "@graphql/index"

import AllLevelsQuery from "./root/query/all-levels"
import TransactionsByHashQuery from "./root/query/transactions-by-hash"
import UserDetailsByPhoneQuery from "./root/query/user-details-by-phone"
import UserDetailsByWalletNameQuery from "./root/query/user-details-by-wallet-name"

const QueryType = new GT.Object({
  name: "Query",
  fields: () => ({
    allLevels: AllLevelsQuery,
    userDetailsByPhone: UserDetailsByPhoneQuery,
    userDetailsByWalletName: UserDetailsByWalletNameQuery,
    transactionsByHash: TransactionsByHashQuery,
  }),
})

export default QueryType
