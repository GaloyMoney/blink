import IWallet from "../abstract/wallet"

import SignedAmount from "../scalar/signed-amount"

import WalletCurrency from "../scalar/wallet-currency"

import OnChainAddress from "../scalar/on-chain-address"

import PaymentHash from "../scalar/payment-hash"

import IInvoice from "../abstract/invoice"

import Transaction, { TransactionConnection } from "./transaction"

import { GT } from "@/graphql/index"
import { normalizePaymentAmount } from "@/graphql/shared/root/mutation"
import {
  connectionArgs,
  connectionFromPaginatedArray,
  checkedConnectionArgs,
} from "@/graphql/connections"
import { mapError } from "@/graphql/error-map"

import { Wallets } from "@/app"

import { WalletCurrency as WalletCurrencyDomain } from "@/domain/shared"

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
    accountId: {
      type: GT.NonNullID,
    },
    walletCurrency: {
      type: GT.NonNull(WalletCurrency),
      resolve: (source) => source.currency,
    },
    balance: {
      type: GT.NonNull(SignedAmount),
      description: "A balance stored in BTC.",
      resolve: async (source) => {
        const balanceSats = await Wallets.getBalanceForWallet({ walletId: source.id })
        if (balanceSats instanceof Error) {
          throw mapError(balanceSats)
        }
        return balanceSats
      },
    },
    pendingIncomingBalance: {
      type: GT.NonNull(SignedAmount),
      description: "An unconfirmed incoming onchain balance.",
      resolve: async (source) => {
        const balanceSats = await Wallets.getPendingOnChainBalanceForWallets([source])
        if (balanceSats instanceof Error) {
          throw mapError(balanceSats)
        }
        return normalizePaymentAmount(balanceSats[source.id]).amount
      },
    },
    transactions: {
      type: TransactionConnection,
      args: connectionArgs,
      resolve: async (source, args) => {
        const paginationArgs = checkedConnectionArgs(args)
        if (paginationArgs instanceof Error) {
          throw paginationArgs
        }

        const { result, error } = await Wallets.getTransactionsForWallets({
          wallets: [source],
          paginationArgs,
        })
        if (error instanceof Error) {
          throw mapError(error)
        }

        // Non-null signal to type checker; consider fixing in PartialResult type
        if (!result?.slice) throw error

        return connectionFromPaginatedArray<WalletTransaction>(
          result.slice,
          result.total,
          paginationArgs,
        )
      },
      description: "A list of BTC transactions associated with this wallet.",
    },
    pendingTransactions: {
      type: GT.NonNullList(Transaction),
      resolve: async (source) => {
        const transactions = await Wallets.getPendingOnChainTransactionsForWallets({
          wallets: [source],
        })
        if (transactions instanceof Error) {
          throw mapError(transactions)
        }
        return transactions
      },
    },
    pendingTransactionsByAddress: {
      type: GT.NonNullList(Transaction),
      args: {
        address: {
          type: GT.NonNull(OnChainAddress),
          description: "Returns the items that include this address.",
        },
      },
      resolve: async (source, args) => {
        const { address } = args
        if (address instanceof Error) throw address

        const transactions = await Wallets.getPendingTransactionsForWalletsByAddresses({
          wallets: [source],
          addresses: [address],
        })
        if (transactions instanceof Error) {
          throw mapError(transactions)
        }
        return transactions
      },
    },
    transactionsByAddress: {
      type: TransactionConnection,
      args: {
        ...connectionArgs,
        address: {
          type: GT.NonNull(OnChainAddress),
          description: "Returns the items that include this address.",
        },
      },
      resolve: async (source, args) => {
        const paginationArgs = checkedConnectionArgs(args)
        if (paginationArgs instanceof Error) {
          throw paginationArgs
        }

        const { address } = args
        if (address instanceof Error) throw address

        const { result, error } = await Wallets.getTransactionsForWalletsByAddresses({
          wallets: [source],
          addresses: [address],
          paginationArgs,
        })
        if (error instanceof Error) {
          throw mapError(error)
        }

        // Non-null signal to type checker; consider fixing in PartialResult type
        if (!result?.slice) throw error

        return connectionFromPaginatedArray<WalletTransaction>(
          result.slice,
          result.total,
          paginationArgs,
        )
      },
    },
    invoiceByPaymentHash: {
      type: GT.NonNull(IInvoice),
      args: {
        paymentHash: {
          type: GT.NonNull(PaymentHash),
        },
      },
      resolve: async (source, args) => {
        const { paymentHash } = args
        if (paymentHash instanceof Error) throw paymentHash

        const invoice = await Wallets.getInvoiceForWalletByPaymentHash({
          walletId: source.id,
          paymentHash,
        })

        if (invoice instanceof Error) {
          throw mapError(invoice)
        }

        return invoice
      },
    },
    transactionsByPaymentHash: {
      type: GT.NonNullList(Transaction),
      args: {
        paymentHash: {
          type: GT.NonNull(PaymentHash),
        },
      },
      resolve: async (source, args) => {
        const { paymentHash } = args
        if (paymentHash instanceof Error) throw paymentHash

        const transactions = await Wallets.getTransactionsForWalletByPaymentHash({
          walletId: source.id,
          paymentHash,
        })

        if (transactions instanceof Error) {
          throw mapError(transactions)
        }

        return transactions
      },
    },
    transactionById: {
      type: GT.NonNull(Transaction),
      args: {
        transactionId: {
          type: GT.NonNullID,
        },
      },
      resolve: async (source, args) => {
        const { transactionId } = args
        if (transactionId instanceof Error) throw transactionId

        const transaction = await Wallets.getTransactionForWalletById({
          walletId: source.id,
          transactionId,
        })

        if (transaction instanceof Error) {
          throw mapError(transaction)
        }

        return transaction
      },
    },
  }),
})

export default BtcWallet
