import { CouldNotFindTransactionsForAccountError } from "@domain/errors"

import { GT } from "@graphql/index"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import {
  connectionArgs,
  connectionFromPaginatedArray,
  checkedConnectionArgs,
} from "@graphql/connections"

import Wallet from "@graphql/types/abstract/wallet"
import IAccount from "@graphql/types/abstract/account"
import WalletId from "@graphql/types/scalar/wallet-id"
import DisplayCurrency from "@graphql/types/scalar/display-currency"

import { WalletsRepository } from "@services/mongoose"

import { Accounts, Wallets } from "@app"

import getUuidByString from "uuid-by-string"

import AccountLimits from "./account-limits"
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

    displayCurrency: {
      type: GT.NonNull(DisplayCurrency),
      resolve: (source) => source.displayCurrency,
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

    limits: {
      type: GT.NonNull(AccountLimits),
      resolve: (source: Account) => source,
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
      resolve: async (source, args) => {
        const paginationArgs = checkedConnectionArgs(args)
        if (paginationArgs instanceof Error) {
          throw paginationArgs
        }

        let { walletIds } = args
        if (walletIds instanceof Error) {
          return { errors: [{ message: walletIds.message }] }
        }

        if (walletIds === undefined) {
          const wallets = await WalletsRepository().listByAccountId(source.id)
          if (wallets instanceof Error) {
            return { errors: [mapAndParseErrorForGqlResponse(wallets)] }
          }
          walletIds = wallets.map((wallet) => wallet.id)
        }

        const { result, error } = await Accounts.getTransactionsForAccountByWalletIds({
          account: source,
          walletIds,
          paginationArgs,
        })

        if (error instanceof Error) {
          throw mapAndParseErrorForGqlResponse(error)
        }

        if (!result?.slice) {
          const nullError = new CouldNotFindTransactionsForAccountError()
          throw mapAndParseErrorForGqlResponse(nullError)
        }

        return connectionFromPaginatedArray<WalletTransaction>(
          result.slice,
          result.total,
          paginationArgs,
        )
      },
    },
  }),
})

export default ConsumerAccount
