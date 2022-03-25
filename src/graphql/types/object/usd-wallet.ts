import { GT } from "@graphql/index"
import { connectionArgs, connectionFromArray } from "@graphql/connections"

import { Wallets } from "@app"

import { WalletCurrency as WalletCurrencyDomain } from "@domain/shared"

import IWallet from "@graphql/types/abstract/wallet"
import SignedAmount from "@graphql/types/scalar/signed-amount"
import WalletCurrency from "@graphql/types/scalar/wallet-currency"
import PaymentHash from "@graphql/types/scalar/payment-hash"
import { TransactionConnection } from "@graphql/types/object/transaction"
import { InputValidationError } from "@graphql/error"

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
      args: { ...connectionArgs, hash: { type: PaymentHash } },
      resolve: async (source, args) => {
        const { hash } = args
        if (hash instanceof InputValidationError) {
          return { errors: [{ message: hash.message }] }
        }

        const { result: transactions, error } = await Wallets.getTransactionsForWallet({
          wallet: source,
          hash,
        })
        if (error instanceof Error || transactions === null) {
          throw error
        }
        return connectionFromArray<WalletTransaction>(transactions, args)
      },
    },
  }),
})

export default UsdWallet
