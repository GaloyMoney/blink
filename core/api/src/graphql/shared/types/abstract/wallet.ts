import dedent from "dedent"

import Transaction, { TransactionConnection } from "../object/transaction"
import WalletCurrency from "../scalar/wallet-currency"
import SignedAmount from "../scalar/signed-amount"
import OnChainAddress from "../scalar/on-chain-address"
import PaymentHash from "../scalar/payment-hash"

import IInvoice, { IInvoiceConnection } from "./invoice"

import { connectionArgs } from "@/graphql/connections"
import { GT } from "@/graphql/index"

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
    pendingIncomingTransactionsByAddress: {
      description: dedent`Pending incoming OnChain transactions. When transactions
      are confirmed they will receive a new id and be found in the transactions
      list. Transactions are ordered anti-chronologically,
      ie: the newest transaction will be first`,
      type: GT.NonNullList(Transaction),
      args: {
        address: {
          type: GT.NonNull(OnChainAddress),
          description: "Returns the items that include this address.",
        },
      },
    },
    pendingIncomingTransactions: {
      description: dedent`Pending incoming OnChain transactions. When transactions
      are confirmed they will receive a new id and be found in the transactions
      list. Transactions are ordered anti-chronologically,
      ie: the newest transaction will be first`,
      type: GT.NonNullList(Transaction),
    },
    invoiceByPaymentHash: {
      type: GT.NonNull(IInvoice),
      args: {
        paymentHash: {
          type: GT.NonNull(PaymentHash),
          description:
            "The lightning invoice with the matching paymentHash belonging to this wallet.",
        },
      },
    },
    invoices: {
      type: IInvoiceConnection,
      args: {
        ...connectionArgs,
      },
    },
    transactionsByPaymentHash: {
      type: GT.NonNullList(Transaction),
      description:
        "Returns the transactions that include this paymentHash. This should be a list of size one for a received lightning payment. This can be more that one transaction for a sent lightning payment.",
      args: {
        paymentHash: {
          type: GT.NonNull(PaymentHash),
          description:
            "The payment hash of the lightning invoice paid in this transaction.",
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
