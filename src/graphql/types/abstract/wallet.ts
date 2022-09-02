import dedent from "dedent"

import { GT } from "@graphql/index"
import { connectionArgs, connectionFromArray } from "@graphql/connections"

import { TransactionConnection } from "../object/transaction"
import WalletCurrency from "../scalar/wallet-currency"
import SignedAmount from "../scalar/signed-amount"
import OnChainAddress from "../scalar/on-chain-address"

const IWallet = GT.Interface({
  name: "Wallet",
  description: "A generic wallet which stores value in one of our supported currencies.",
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    accountId: {
      type: GT.NonNullID,
    },
    walletCurrency: {
      type: GT.NonNull(WalletCurrency),
    },
    balance: {
      type: GT.NonNull(SignedAmount),
    },
    pendingIncomingBalance: {
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
    transactionsByAddress: {
      description: dedent`Transactions are ordered anti-chronologically,
      ie: the newest transaction will be first`,
      type: TransactionConnection,
      args: {
        ...connectionArgs,
        address: {
          type: GT.NonNull(OnChainAddress),
          description: "Returns the items that include this address.",
        },
      },
    },
  }),
})

export default IWallet
