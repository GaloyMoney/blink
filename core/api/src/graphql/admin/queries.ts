import AllLevelsQuery from "./root/query/all-levels"
import LightningInvoiceQuery from "./root/query/lightning-invoice"
import LightningPaymentQuery from "./root/query/lightning-payment"
import TransactionByIdQuery from "./root/query/transaction-by-id"
import TransactionsByHashQuery from "./root/query/transactions-by-hash"
import TransactionsByPaymentRequestQuery from "./root/query/transactions-by-payment-request"
import AccountDetailsByUserPhoneQuery from "./root/query/account-details-by-phone"
import AccountDetailsByUsernameQuery from "./root/query/account-details-by-username"
import AccountDetailsByUserEmailQuery from "./root/query/account-details-by-email"
import WalletQuery from "./root/query/wallet"
import AccountDetailsByAccountId from "./root/query/account-details-by-account-id"
import AccountDetailsByUserId from "./root/query/account-details-by-user-id"
import MerchantsPendingApprovalQuery from "./root/query/merchants-pending-approval-listing"
import FilteredUserCountQuery from "./root/query/filtered-user-count"

import { GT } from "@/graphql/index"

export const queryFields = {
  unauthed: {},
  authed: {
    allLevels: AllLevelsQuery,
    accountDetailsByUserPhone: AccountDetailsByUserPhoneQuery,
    accountDetailsByUsername: AccountDetailsByUsernameQuery,
    accountDetailsByEmail: AccountDetailsByUserEmailQuery,
    accountDetailsByAccountId: AccountDetailsByAccountId,
    accountDetailsByUserId: AccountDetailsByUserId,
    transactionById: TransactionByIdQuery,
    transactionsByHash: TransactionsByHashQuery,
    transactionsByPaymentRequest: TransactionsByPaymentRequestQuery,
    lightningInvoice: LightningInvoiceQuery,
    lightningPayment: LightningPaymentQuery,
    wallet: WalletQuery,
    merchantsPendingApproval: MerchantsPendingApprovalQuery,
    filteredUserCount: FilteredUserCountQuery,
  },
}

export const QueryType = GT.Object({
  name: "Query",
  fields: () => ({ ...queryFields.unauthed, ...queryFields.authed }),
})
