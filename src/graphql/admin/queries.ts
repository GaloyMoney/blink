import { getAccountsConfig } from "@config"

import { GT } from "@graphql/index"

import AllLevelsQuery from "./root/query/all-levels"
import LightningInvoiceQuery from "./root/query/lightning-invoice"
import LightningPaymentQuery from "./root/query/lightning-payment"
import TransactionByIdQuery from "./root/query/transaction-by-id"
import TransactionsByHashQuery from "./root/query/transactions-by-hash"
import AccountDetailsByUserPhoneQuery from "./root/query/account-details-by-phone"
import AccountDetailsByUsernameQuery from "./root/query/account-details-by-username"
import AccountsDetailsByCustomFieldQuery from "./root/query/accounts-details-by-custom-field"
import ListWalletIdsQuery from "./root/query/all-walletids"
import WalletQuery from "./root/query/wallet"

const fields = {
  allLevels: AllLevelsQuery,
  accountDetailsByUserPhone: AccountDetailsByUserPhoneQuery,
  accountDetailsByUsername: AccountDetailsByUsernameQuery,
  transactionById: TransactionByIdQuery,
  transactionsByHash: TransactionsByHashQuery,
  lightningInvoice: LightningInvoiceQuery,
  lightningPayment: LightningPaymentQuery,
  listWalletIds: ListWalletIdsQuery,
  wallet: WalletQuery,
}

const { customFields } = getAccountsConfig()
if (customFields && customFields.length > 0) {
  Object.assign(fields, {
    accountsDetailsByCustomField: AccountsDetailsByCustomFieldQuery,
  })
}

const QueryType = GT.Object({
  name: "Query",
  fields: () => fields,
})

export default QueryType
