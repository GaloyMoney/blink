import { GT } from "@graphql/index"

import AllLevelsQuery from "./root/query/all-levels"
import LightningInvoiceQuery from "./root/query/lightning-invoice"
import LightningPaymentQuery from "./root/query/lightning-payment"
import TransactionsByHashQuery from "./root/query/transactions-by-hash"
import UserDetailsByPhoneQuery from "./root/query/user-details-by-phone"
import UserDetailsByUsernameQuery from "./root/query/user-details-by-username"

const QueryType = new GT.Object({
  name: "Query",
  fields: () => ({
    allLevels: AllLevelsQuery,
    userDetailsByPhone: UserDetailsByPhoneQuery,
    userDetailsByUsername: UserDetailsByUsernameQuery,
    transactionsByHash: TransactionsByHashQuery,
    lightningInvoice: LightningInvoiceQuery,
    lightningPayment: LightningPaymentQuery,
  }),
})

export default QueryType
