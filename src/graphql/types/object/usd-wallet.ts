import { GT } from "@graphql/index"
import { connectionArgs, connectionFromArray } from "@graphql/connections"

import { Wallets } from "@app"

import { WalletCurrency as WalletCurrencyDomain } from "@domain/shared"

import IWallet from "../abstract/wallet"

import WalletCurrency from "../scalar/wallet-currency"
import SignedAmount from "../scalar/signed-amount"

import TransactionConnection from "./transaction-connection"

const UsdWallet = GT.Object<Wallet>({
  name: "UsdWallet",
  description:
    "A wallet belonging to an account which contains a USD balance and a list of transactions.",
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
        const balanceCents = await Wallets.getBalanceForWallet({
          walletId: source.id,
          logger,
        })
        if (balanceCents instanceof Error) throw balanceCents
        return Math.floor(balanceCents)
      },
    },
    transactions: {
      type: TransactionConnection,
      args: connectionArgs,
      resolve: async (source, args) => {
        const { result: transactions, error } = await Wallets.getTransactionsForWallets([
          source,
        ])
        if (error instanceof Error || transactions === null) {
          throw error
        }
        return connectionFromArray<WalletTransaction>(transactions, args)
      },
    },
  }),
})

export default UsdWallet
