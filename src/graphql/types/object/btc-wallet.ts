import { GT } from "@graphql/index"
import { normalizePaymentAmount } from "@graphql/root/mutation"
import { connectionArgs, connectionFromArray } from "@graphql/connections"
import { mapError } from "@graphql/error-map"

import { Wallets } from "@app"

import { WalletCurrency as WalletCurrencyDomain } from "@domain/shared"

import IWallet from "../abstract/wallet"

import SignedAmount from "../scalar/signed-amount"
import WalletCurrency from "../scalar/wallet-currency"
import OnChainAddress from "../scalar/on-chain-address"

import { TransactionConnection } from "./transaction"

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
      resolve: async (source, args, { logger }) => {
        const balanceSats = await Wallets.getBalanceForWallet({
          walletId: source.id,
          logger,
        })
        if (balanceSats instanceof Error) throw mapError(balanceSats)
        return balanceSats
      },
    },
    pendingIncomingBalance: {
      type: GT.NonNull(SignedAmount),
      description: "An unconfirmed incoming onchain balance.",
      resolve: async (source) => {
        const balanceSats = await Wallets.getPendingOnChainBalanceForWallets([source])
        if (balanceSats instanceof Error) throw mapError(balanceSats)
        return normalizePaymentAmount(balanceSats[source.id]).amount
      },
    },
    transactions: {
      type: TransactionConnection,
      args: connectionArgs,
      resolve: async (source, args) => {
        const { result: transactions, error } = await Wallets.getTransactionsForWallets([
          source,
        ])
        if (error instanceof Error) throw mapError(error)

        // Non-null signal to type checker; consider fixing in PartialResult type
        if (transactions === null) throw error
        return connectionFromArray<WalletTransaction>(transactions, args)
      },
      description: "A list of BTC transactions associated with this wallet.",
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
        const { address } = args
        if (address instanceof Error) throw address

        const { result: transactions, error } =
          await Wallets.getTransactionsForWalletsByAddresses({
            wallets: [source],
            addresses: [address],
          })
        if (error instanceof Error) throw mapError(error)

        // Non-null signal to type checker; consider fixing in PartialResult type
        if (transactions === null) throw error
        return connectionFromArray<WalletTransaction>(transactions, args)
      },
    },
  }),
})

export default BtcWallet
