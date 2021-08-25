import { connectionArgs, connectionFromArray } from "graphql-relay"

import { GT } from "@graphql/index"

import { TransactionConnection } from "./transaction"
import WalletCurrency from "../scalar/wallet-currency"
import SignedAmount from "../scalar/signed-amount"

const IWallet = new GT.Interface({
  name: "Wallet",
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
      resolve: (source, args) => {
        return connectionFromArray(source.transactions, args)
      },
    },
  }),
})

export default IWallet
