import { GT } from "@graphql/index"
import { connectionArgs, connectionFromArray } from "@graphql/connections"

import { Wallets } from "@app"

import IWallet from "../abstract/wallet"

import SignedAmount from "../scalar/signed-amount"
import WalletCurrency from "../scalar/wallet-currency"

import { TransactionConnection } from "./transaction"

const BTCWallet = GT.Object({
  name: "BTCWallet",
  interfaces: () => [IWallet],
  isTypeOf: (source) => true || source.type === "btc", // TODO: make this work
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    walletCurrency: {
      type: GT.NonNull(WalletCurrency),
      resolve: () => "BTC",
    },
    balance: {
      type: GT.NonNull(SignedAmount),
      resolve: async (source: Wallet, __, { logger }) => {
        const balanceSats = await Wallets.getBalanceForWallet({
          walletId: source.id,
          logger,
        })
        if (balanceSats instanceof Error) throw balanceSats
        return balanceSats
      },
    },

    transactions: {
      type: TransactionConnection,
      args: connectionArgs,
      resolve: async (source: Wallet, args) => {
        const { result: transactions, error } = await Wallets.getTransactionsForWallet(
          source,
        )
        if (error instanceof Error || transactions === null) {
          throw error
        }
        return connectionFromArray<WalletTransaction>(transactions, args)
      },
    },
  }),
})

export default BTCWallet
