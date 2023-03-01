import getUuidByString from "uuid-by-string"

import { SAT_PRICE_PRECISION_OFFSET, USD_PRICE_PRECISION_OFFSET } from "@config"

import { Accounts, Prices, Wallets } from "@app"

import { usdMajorToMinorUnit } from "@domain/fiat"
import { CouldNotFindTransactionsForAccountError } from "@domain/errors"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import {
  connectionArgs,
  connectionFromPaginatedArray,
  checkedConnectionArgs,
} from "@graphql/connections"

import { WalletsRepository } from "@services/mongoose"

import IAccount from "../abstract/account"
import Wallet from "../abstract/wallet"

import WalletId from "../scalar/wallet-id"
import DisplayCurrency from "../scalar/display-currency"

import RealtimePrice from "./realtime-price"
import { TransactionConnection } from "./transaction"

const BusinessAccount = GT.Object({
  name: "BusinessAccount",
  interfaces: () => [IAccount],
  isTypeOf: () => false,
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
      resolve: (source, args, { domainAccount }: { domainAccount: Account }) =>
        domainAccount.defaultWalletId,
    },

    displayCurrency: {
      type: GT.NonNull(DisplayCurrency),
      resolve: (source, args, { domainAccount }: { domainAccount: Account }) =>
        domainAccount.displayCurrency,
    },

    realtimePrice: {
      type: GT.NonNull(RealtimePrice),
      resolve: async (source) => {
        const currency = source.displayCurrency
        const btcPrice = await Prices.getCurrentSatPrice({ currency })
        if (btcPrice instanceof Error) throw mapError(btcPrice)

        const usdPrice = await Prices.getCurrentUsdCentPrice({ currency })
        if (usdPrice instanceof Error) throw mapError(usdPrice)

        const centsPerSat = usdMajorToMinorUnit(btcPrice.price)
        const centsPerUsdCent = usdMajorToMinorUnit(usdPrice.price)

        return {
          timestamp: btcPrice.timestamp,
          denominatorCurrency: currency,
          btcSatPrice: {
            base: Math.round(centsPerSat * 10 ** SAT_PRICE_PRECISION_OFFSET),
            offset: SAT_PRICE_PRECISION_OFFSET,
            currencyUnit: `${currency}CENT`,
          },
          usdCentPrice: {
            base: Math.round(centsPerUsdCent * 10 ** USD_PRICE_PRECISION_OFFSET),
            offset: USD_PRICE_PRECISION_OFFSET,
            currencyUnit: `${currency}CENT`,
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

        if (walletIds === undefined) {
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

        return connectionFromPaginatedArray<WalletTransaction>(
          result.slice,
          result.total,
          paginationArgs,
        )
      },
    },
  }),
})

export default BusinessAccount
