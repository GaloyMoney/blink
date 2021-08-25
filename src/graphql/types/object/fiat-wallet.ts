import { connectionArgs, connectionFromArray } from "graphql-relay"

import { GT } from "@graphql/index"
import { TransactionConnection } from "../abstract/transaction"
import IWallet from "../abstract/wallet"
import WalletCurrency from "../scalar/wallet-currency"
import SignedAmount from "../scalar/signed-amount"
import * as Wallets from "@app/wallets"

const FiatWallet = new GT.Object({
  name: "FiatWallet",
  interfaces: () => [IWallet],
  isTypeOf: (source) => source.type === "fiat", // TODO: make this work
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    walletCurrency: {
      type: GT.NonNull(WalletCurrency),
    },
    balance: {
      type: GT.NonNull(SignedAmount),
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
        return connectionFromArray(transactions, args)
      },
    },
  }),
})

export default FiatWallet
