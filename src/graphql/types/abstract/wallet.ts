import dedent from "dedent"

import { GT } from "@graphql/index"
import { connectionArgs, connectionFromArray } from "@graphql/connections"

import TransactionConnection from "../object/transaction-connection"
import WalletCurrency from "../scalar/wallet-currency"
import SignedAmount from "../scalar/signed-amount"

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
      args: connectionArgs,
      resolve: (source, args) => {
        return connectionFromArray<WalletTransaction>(source.transactions, args)
      },
    },
  }),
})

export default IWallet
