import { GT } from "@graphql/index"
import { connectionArgs, connectionFromArray } from "@graphql/connections"

import { Wallets } from "@app"

import { WalletCurrency as WalletCurrencyDomain } from "@domain/wallets"

import IWallet from "../abstract/wallet"

import WalletCurrency from "../scalar/wallet-currency"
import SignedAmount from "../scalar/signed-amount"

import { TransactionConnection } from "./transaction"

const UsdWallet = GT.Object<Wallet>({
  name: "UsdWallet",
  interfaces: () => [IWallet],
  isTypeOf: (source) => source.currency === WalletCurrencyDomain.Usd,
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    walletCurrency: {
      type: GT.NonNull(WalletCurrency),
      resolve: (source) => source.currency,
    },
    balance: {
      type: GT.NonNull(SignedAmount),
      resolve: async (source, args, { logger }) => {
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
      resolve: async (source, args) => {
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

export default UsdWallet
