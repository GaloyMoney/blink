import getUuidByString from "uuid-by-string"
import { GraphQLFieldConfig, ThunkObjMap } from "graphql"

import { getAccountsConfig } from "@config"

import { Accounts, Wallets } from "@app"

import {
  CouldNotFindError,
  CouldNotFindTransactionsForAccountError,
} from "@domain/errors"
import { NoAccountCustomFieldsError } from "@domain/accounts"

import { WalletsRepository } from "@services/mongoose"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import { connectionArgs, connectionFromArray } from "graphql-relay"

import IAccount from "../abstract/account"
import Wallet from "../abstract/wallet"

import WalletId from "../scalar/wallet-id"

import { TransactionConnection } from "./transaction"
import AccountCustomFields from "./account-custom-fields"

const { customFields } = getAccountsConfig()

const BusinessAccount = GT.Object({
  name: "BusinessAccount",
  interfaces: () => [IAccount],
  isTypeOf: () => false,
  fields: () => {
    const fields: ThunkObjMap<GraphQLFieldConfig<Account, unknown>> = {
      id: {
        type: GT.NonNullID,
        resolve: (source: Account) => getUuidByString(source.id),
      },

      wallets: {
        type: GT.NonNullList(Wallet),
        resolve: async (source: Account) => {
          return Wallets.listWalletsByAccountId(source.id)
        },
      },

      defaultWalletId: {
        type: GT.NonNull(WalletId),
        resolve: (source: Account) => source.defaultWalletId,
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
      transactions: {
        description:
          "A list of all transactions associated with walletIds optionally passed.",
        type: TransactionConnection,
        args: {
          ...connectionArgs,
          walletIds: {
            type: GT.List(WalletId),
          },
        },
        resolve: async (source: Account, args) => {
          let { walletIds } = args
          if (walletIds instanceof Error) {
            return { errors: [{ message: walletIds.message }] }
          }

          if (walletIds === undefined) {
            const wallets = await WalletsRepository().listByAccountId(source.id)
            if (wallets instanceof Error) {
              return { errors: [{ message: walletIds.message }] }
            }
            walletIds = wallets.map((wallet) => wallet.id)
          }

          const { result: transactions, error } =
            await Accounts.getTransactionsForAccountByWalletIds({
              account: source,
              walletIds,
            })
          if (error instanceof Error) {
            throw mapError(error)
          }
          if (transactions === null) {
            const nullError = new CouldNotFindTransactionsForAccountError()
            throw mapError(nullError)
          }

          return connectionFromArray<WalletTransaction>(transactions, args)
        },
      },
    }

    if (customFields && customFields.length > 0) {
      return Object.assign(fields, {
        data: {
          description: "Additional account information",
          type: AccountCustomFields,
          resolve: async (source: Account) => {
            const accountCustomFields = await Accounts.getAccountCustomFields(source.id)
            if (accountCustomFields instanceof CouldNotFindError) return null
            if (accountCustomFields instanceof NoAccountCustomFieldsError) return null
            if (accountCustomFields instanceof Error) throw accountCustomFields

            return accountCustomFields.customFields
          },
        },
      })
    }

    return fields
  },
})

export default BusinessAccount
