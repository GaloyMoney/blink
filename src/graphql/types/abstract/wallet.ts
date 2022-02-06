import dedent from "dedent"

import { GT } from "@graphql/index"
import { connectionArgs, connectionFromArray } from "@graphql/connections"

import { TransactionConnection } from "../object/transaction"
import WalletCurrency from "../scalar/wallet-currency"
import SignedAmount from "../scalar/signed-amount"

const IWallet = GT.Interface({
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
      description: dedent`Transactions are ordered anti-chronogically,
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
