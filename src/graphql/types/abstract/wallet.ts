import dedent from "dedent"

import { GT } from "@graphql/index"
import { connectionArgs, connectionFromArray } from "@graphql/connections"

import { TransactionConnection } from "@graphql/types/object/transaction"
import WalletCurrency from "@graphql/types/scalar/wallet-currency"
import PaymentHash from "@graphql/types/scalar/payment-hash"
import SignedAmount from "@graphql/types/scalar/signed-amount"

const IWallet = GT.Interface({
  name: "Wallet",
  description: "A generic wallet which stores value in one of our supported currencies.",
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
      description: dedent`Transactions are ordered anti-chronologically,
      ie: the newest transaction will be first`,
      type: TransactionConnection,
      args: { ...connectionArgs, hash: { type: PaymentHash } },
      resolve: (source, args) => {
        return connectionFromArray<WalletTransaction>(source.transactions, args)
      },
    },
  }),
})

export default IWallet
