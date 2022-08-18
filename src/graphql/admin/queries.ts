import { GraphQLResolveInfo } from "graphql"

import { getAccountsConfig } from "@config"

import { GT } from "@graphql/index"

import {
  ACCOUNT_USERNAME,
  addAttributesToCurrentSpanAndPropagate,
  SemanticAttributes,
} from "@services/tracing"

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

const addTracing = (trcFields: typeof fields) => {
  let key: keyof typeof trcFields
  for (key in trcFields) {
    const original = trcFields[key].resolve
    if (original) {
      type originalParamsTypes = Parameters<typeof original>
      trcFields[key].resolve = (
        source: originalParamsTypes[0],
        args: originalParamsTypes[1],
        context: GraphQLContext | GraphQLContextForUser,
        info: GraphQLResolveInfo,
      ) => {
        const { ip, domainAccount, domainUser } = context
        return addAttributesToCurrentSpanAndPropagate(
          {
            [SemanticAttributes.ENDUSER_ID]: domainUser?.id,
            [ACCOUNT_USERNAME]: domainAccount?.username,
            [SemanticAttributes.HTTP_CLIENT_IP]: ip,
          },
          () => original(source, args, context, info),
        )
      }
    }
  }
  return trcFields
}

const QueryType = GT.Object({
  name: "Query",
  fields: () => addTracing(fields),
})

export default QueryType
