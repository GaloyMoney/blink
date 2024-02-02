import AllLevelsQuery from "./root/query/all-levels"
import LightningInvoiceQuery from "./root/query/lightning-invoice"
import LightningPaymentQuery from "./root/query/lightning-payment"
import TransactionByIdQuery from "./root/query/transaction-by-id"
import TransactionsByHashQuery from "./root/query/transactions-by-hash"
import AccountDetailsByUserPhoneQuery from "./root/query/account-details-by-phone"
import AccountDetailsByUsernameQuery from "./root/query/account-details-by-username"
import AccountDetailsByUserEmailQuery from "./root/query/account-details-by-email"
import ListWalletIdsQuery from "./root/query/all-walletids"
import WalletQuery from "./root/query/wallet"
import AccountDetailsByAccountId from "./root/query/account-details-by-account-id"
import AccountDetailsByUserId from "./root/query/account-details-by-user-id"
import MerchantsPendingApprovalQuery from "./root/query/merchants-pending-approval-listing"

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
    lightningInvoice: LightningInvoiceQuery,
    lightningPayment: LightningPaymentQuery,
    listWalletIds: ListWalletIdsQuery,
    wallet: WalletQuery,
    merchantsPendingApproval: MerchantsPendingApprovalQuery,
  },
}

export const QueryType = GT.Object({
  name: "Query",
  fields: () => ({ ...queryFields.unauthed, ...queryFields.authed }),
})
