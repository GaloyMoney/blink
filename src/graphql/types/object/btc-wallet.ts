import { Wallets } from "@app"

import { WalletCurrency as WalletCurrencyDomain } from "@domain/shared"

import { GT } from "@graphql/index"
import { connectionArgs, connectionFromArray } from "@graphql/connections"
import { InputValidationError } from "@graphql/error"

import IWallet from "@graphql/types/abstract/wallet"
import SignedAmount from "@graphql/types/scalar/signed-amount"
import WalletCurrency from "@graphql/types/scalar/wallet-currency"
import PaymentHash from "@graphql/types/scalar/payment-hash"
import { TransactionConnection } from "@graphql/types/object/transaction"

const BtcWallet = GT.Object<Wallet>({
  name: "BTCWallet",
  description:
    "A wallet belonging to an account which contains a BTC balance and a list of transactions.",
  interfaces: () => [IWallet],
  isTypeOf: (source) => source.currency === WalletCurrencyDomain.Btc,
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
      description: "A balance stored in BTC.",
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
      description: "A list of BTC transactions associated with this wallet.",
    },
  }),
})

export default BtcWallet
