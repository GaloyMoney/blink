import IWallet from "../abstract/wallet"
import PaymentHash from "../scalar/payment-hash"
import SignedAmount from "../scalar/signed-amount"
import WalletCurrency from "../scalar/wallet-currency"
import OnChainAddress from "../scalar/on-chain-address"
import LnPaymentRequest from "../scalar/ln-payment-request"
import TxExternalId from "../scalar/tx-external-id"
import IInvoice, { IInvoiceConnection } from "../abstract/invoice"

import Transaction, { TransactionConnection } from "./transaction"

import { WalletCurrency as WalletCurrencyDomain } from "@/domain/shared"

import { normalizePaymentAmount } from "@/graphql/shared/root/mutation"
import { connectionArgs } from "@/graphql/connections"
import { GT } from "@/graphql/index"
import { mapError } from "@/graphql/error-map"
import { Wallets } from "@/app"

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
        const balanceSats = await Wallets.getPendingIncomingOnChainBalanceForWallets([
          source,
        ])
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
        const result = await Wallets.getTransactionsForWallets({
          wallets: [source],
          rawPaginationArgs: args,
        })

        if (result instanceof Error) {
          throw mapError(result)
        }

        return result
      },
      description: "A list of BTC transactions associated with this wallet.",
    },
    pendingIncomingTransactions: {
      type: GT.NonNullList(Transaction),
      resolve: async (source) => {
        const transactions =
          await Wallets.getPendingIncomingOnChainTransactionsForWallets({
            wallets: [source],
          })
        if (transactions instanceof Error) {
          throw mapError(transactions)
        }
        return transactions
      },
    },
    pendingIncomingTransactionsByAddress: {
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

        const transactions =
          await Wallets.getPendingIncomingOnChainTransactionsForWalletsByAddresses({
            wallets: [source],
            addresses: [address],
          })
        if (transactions instanceof Error) {
          throw mapError(transactions)
        }
        return transactions
      },
    },
    invoices: {
      description: "A list of all invoices associated with walletIds optionally passed.",
      type: IInvoiceConnection,
      args: {
        ...connectionArgs,
      },
      resolve: async (source, args) => {
        const result = await Wallets.getInvoicesForWallets({
          wallets: [source],
          rawPaginationArgs: args,
        })

        if (result instanceof Error) {
          throw mapError(result)
        }

        return result
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
        const { address, ...rawPaginationArgs } = args
        if (address instanceof Error) throw address

        const result = await Wallets.getTransactionsForWalletsByAddresses({
          wallets: [source],
          addresses: [address],
          rawPaginationArgs,
        })

        if (result instanceof Error) {
          throw mapError(result)
        }

        return result
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
    transactionsByPaymentRequest: {
      type: GT.NonNullList(Transaction),
      args: {
        paymentRequest: {
          type: GT.NonNull(LnPaymentRequest),
        },
      },
      resolve: async (source, args) => {
        const { paymentRequest } = args
        if (paymentRequest instanceof Error) throw paymentRequest

        const transactions = await Wallets.getTransactionsForWalletByPaymentRequest({
          walletId: source.id,
          uncheckedPaymentRequest: paymentRequest,
        })

        if (transactions instanceof Error) {
          throw mapError(transactions)
        }

        return transactions
      },
    },
    transactionsByExternalId: {
      type: TransactionConnection,
      args: {
        ...connectionArgs,
        externalId: {
          type: GT.NonNull(TxExternalId),
        },
      },
      resolve: async (source, args) => {
        const { externalId, ...rawPaginationArgs } = args
        if (externalId instanceof Error) throw externalId

        const result = await Wallets.getTransactionsForWalletsByExternalId({
          walletIds: [source.id],
          uncheckedExternalIdSubstring: externalId,
          rawPaginationArgs,
        })
        if (result instanceof Error) {
          throw mapError(result)
        }

        return result
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
