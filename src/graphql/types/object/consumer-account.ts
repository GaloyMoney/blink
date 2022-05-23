import { GT } from "@graphql/index"
import { connectionArgs, connectionFromArray } from "graphql-relay"

import { Accounts, Wallets } from "@app"
import getUuidByString from "uuid-by-string"

import IAccount from "../abstract/account"
import Wallet from "../abstract/wallet"

import WalletId from "../scalar/wallet-id"

import { TransactionConnection } from "./transaction"

const ConsumerAccount = GT.Object({
  name: "ConsumerAccount",
  interfaces: () => [IAccount],
  isTypeOf: () => true, // TODO: improve

  fields: () => ({
    id: {
      type: GT.NonNullID,
      resolve: (source) => getUuidByString(source.id),
    },

    wallets: {
      type: GT.NonNullList(Wallet),
      resolve: async (source: Account) => {
        return Wallets.listWalletsByAccountId(source.id)
      },
    },

    defaultWalletId: {
      type: GT.NonNull(WalletId),
      resolve: (source) => source.defaultWalletId,
    },

    csvTransactions: {
      description:
        "return CSV stream, base64 encoded, of the list of transactions in the wallet",
      type: GT.NonNull(GT.String),
      args: {
        walletIds: {
          type: GT.NonNullList(WalletId),
        },
      },
      resolve: async (source: Account) => {
        return Accounts.getCSVForAccount(source.id)
      },
    },
    transactionsByWalletIds: {
      description: "A list of all transactions associated with walletIds passed.",
      type: TransactionConnection,
      args: {
        ...connectionArgs,
        walletIds: {
          type: GT.NonNullList(WalletId),
        },
      },
      resolve: async (_, args) => {
        const { walletIds } = args
        if (walletIds instanceof Error) {
          return { errors: [{ message: walletIds.message }] }
        }

        const { result: transactions, error } = await Wallets.getTransactionsForWalletIds(
          walletIds,
        )
        if (error instanceof Error || transactions === null) {
          throw error
        }
        return connectionFromArray<WalletTransaction>(transactions, args)
      },
    },
  }),
})

export default ConsumerAccount
