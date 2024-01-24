import { Accounts, Prices, Wallets } from "@app"

import {
  majorToMinorUnit,
  SAT_PRICE_PRECISION_OFFSET,
  USD_PRICE_PRECISION_OFFSET,
} from "@domain/fiat"
import { CouldNotFindTransactionsForAccountError } from "@domain/errors"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import {
  connectionArgs,
  connectionFromPaginatedArray,
  checkedConnectionArgs,
} from "@graphql/connections"

import Wallet from "@graphql/shared/types/abstract/wallet"
import IAccount from "@graphql/public/types/abstract/account"
import WalletId from "@graphql/shared/types/scalar/wallet-id"
import RealtimePrice from "@graphql/public/types/object/realtime-price"
import DisplayCurrency from "@graphql/shared/types/scalar/display-currency"

import { WalletsRepository } from "@services/mongoose"

import { listEndpoints } from "@app/callback"

import AccountLevel from "../../../shared/types/scalar/account-level"

import { TransactionConnection } from "../../../shared/types/object/transaction"

import AccountLimits from "./account-limits"
import Quiz from "./quiz"
import CallbackEndpoint from "./callback-endpoint"
import { NotificationSettings } from "./notification-settings"

const ConsumerAccount = GT.Object<Account, GraphQLPublicContextAuth>({
  name: "ConsumerAccount",
  interfaces: () => [IAccount],
  isTypeOf: () => true, // TODO: improve

  fields: () => ({
    id: {
      type: GT.NonNullID,
      resolve: (source) => source.uuid,
    },

    callbackEndpoints: {
      type: GT.NonNullList(CallbackEndpoint),
      resolve: async (source, args, { domainAccount }) => {
        return listEndpoints(domainAccount.uuid)
      },
    },

    wallets: {
      type: GT.NonNullList(Wallet),
      resolve: async (source) => {
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

    level: {
      type: GT.NonNull(AccountLevel),
      resolve: (source) => source.level,
    },

    realtimePrice: {
      type: GT.NonNull(RealtimePrice),
      resolve: async (source) => {
        const currency = source.displayCurrency
        const btcPrice = await Prices.getCurrentSatPrice({ currency })
        if (btcPrice instanceof Error) throw mapError(btcPrice)

        const usdPrice = await Prices.getCurrentUsdCentPrice({ currency })
        if (usdPrice instanceof Error) throw mapError(usdPrice)

        const minorUnitPerSat = majorToMinorUnit({
          amount: btcPrice.price,
          displayCurrency: currency,
        })
        const minorUnitPerUsdCent = majorToMinorUnit({
          amount: usdPrice.price,
          displayCurrency: currency,
        })

        return {
          timestamp: btcPrice.timestamp,
          denominatorCurrency: currency,
          btcSatPrice: {
            base: Math.round(minorUnitPerSat * 10 ** SAT_PRICE_PRECISION_OFFSET),
            offset: SAT_PRICE_PRECISION_OFFSET,
            currencyUnit: "MINOR",
          },
          usdCentPrice: {
            base: Math.round(minorUnitPerUsdCent * 10 ** USD_PRICE_PRECISION_OFFSET),
            offset: USD_PRICE_PRECISION_OFFSET,
            currencyUnit: "MINOR",
          },
        }
      },
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
      resolve: async (source) => {
        return Accounts.getCSVForAccount(source.id)
      },
    },

    limits: {
      type: GT.NonNull(AccountLimits),
      resolve: (source) => source,
    },

    quiz: {
      type: GT.NonNullList(Quiz),
      description: "List the quiz questions of the consumer account",
      resolve: (source) => source.quiz,
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

        if (!walletIds) {
          const wallets = await WalletsRepository().listByAccountId(source.id)
          if (wallets instanceof Error) {
            throw mapError(wallets)
          }
          walletIds = wallets.map((wallet) => wallet.id)
        }

        const { result, error } = await Accounts.getTransactionsForAccountByWalletIds({
          account: source,
          walletIds,
          paginationArgs,
        })

        if (error instanceof Error) {
          throw mapError(error)
        }

        if (!result?.slice) {
          const nullError = new CouldNotFindTransactionsForAccountError()
          throw mapError(nullError)
        }

        return connectionFromPaginatedArray<BaseWalletTransaction>(
          result.slice,
          result.total,
          paginationArgs,
        )
      },
    },

    notificationSettings: {
      type: GT.NonNull(NotificationSettings),
      resolve: (source) => source.notificationSettings,
    },
  }),
})

export default ConsumerAccount
