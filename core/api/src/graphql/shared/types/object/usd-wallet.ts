import IWallet from "../abstract/wallet"

import WalletCurrency from "../scalar/wallet-currency"

import SignedAmount from "../scalar/signed-amount"

import OnChainAddress from "../scalar/on-chain-address"

import PaymentHash from "../scalar/payment-hash"

import IInvoice from "../abstract/invoice"

import Transaction, { TransactionConnection } from "./transaction"

import { GT } from "@/graphql/index"
import {
  connectionArgs,
  connectionFromPaginatedArray,
  checkedConnectionArgs,
} from "@/graphql/connections"
import { normalizePaymentAmount } from "@/graphql/shared/root/mutation"
import { mapError } from "@/graphql/error-map"

import { Wallets } from "@/app"

import { WalletCurrency as WalletCurrencyDomain } from "@/domain/shared"

const UsdWallet = GT.Object<Wallet>({
  name: "UsdWallet",
  description:
    "A wallet belonging to an account which contains a USD balance and a list of transactions.",
  interfaces: () => [IWallet],
  isTypeOf: (source) => source.currency === WalletCurrencyDomain.Usd,
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
      resolve: async (source) => {
        const balanceCents = await Wallets.getBalanceForWallet({ walletId: source.id })
        if (balanceCents instanceof Error) {
          throw mapError(balanceCents)
        }
        return Math.floor(balanceCents)
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

export default UsdWallet
