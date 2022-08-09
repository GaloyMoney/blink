import { getAccountsConfig } from "@config"

import { GT } from "@graphql/index"
import { connectionArgs } from "graphql-relay"

import { TransactionConnection } from "../object/transaction"
import AccountCustomFields from "../object/account-custom-fields"

import WalletId from "../scalar/wallet-id"

import Wallet from "./wallet"

const { customFields } = getAccountsConfig()

const IAccount = GT.Interface({
  name: "Account",
  fields: () => {
    const fields = {
      id: {
        type: GT.NonNullID,
      },
      wallets: {
        type: GT.NonNullList(Wallet),
      },
      defaultWalletId: {
        type: GT.NonNull(WalletId),
      },
      csvTransactions: {
        type: GT.NonNull(GT.String),
        args: {
          walletIds: {
            type: GT.NonNullList(WalletId),
          },
        },
      },
      transactions: {
        type: TransactionConnection,
        args: {
          ...connectionArgs,
          walletIds: {
            type: GT.List(WalletId),
          },
        },
      },
      // FUTURE-PLAN: Support a `users: [User!]!` field here
    }

    if (customFields && customFields.length > 0) {
      return Object.assign(fields, {
        data: {
          type: AccountCustomFields,
        },
      })
    }

    return fields
  },
})

export default IAccount
