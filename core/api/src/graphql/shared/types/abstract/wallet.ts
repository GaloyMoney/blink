import dedent from "dedent"

import Transaction, { TransactionConnection } from "../object/transaction"
import WalletCurrency from "../scalar/wallet-currency"
import SignedAmount from "../scalar/signed-amount"
import OnChainAddress from "../scalar/on-chain-address"
import PaymentHash from "../scalar/payment-hash"

import { connectionArgs } from "@/graphql/connections"
import { GT } from "@/graphql/index"
import LnInvoice from "@/graphql/shared/types/object/ln-invoice"

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
    invoiceByHash: {
      type: GT.NonNull(LnInvoice),
      args: {
        paymentHash: {
          type: GT.NonNull(PaymentHash),
        },
      },
    },
    transactionByHash: {
      type: GT.NonNull(Transaction),
      args: {
        hash: {
          type: GT.NonNull(PaymentHash) || GT.NonNull(OnChainAddress),
        },
      },
    },
    transactionById: {
      type: GT.NonNull(Transaction),
      args: {
        transactionId: {
          type: GT.NonNullID,
        },
      },
    },
  }),
})

export default IWallet
