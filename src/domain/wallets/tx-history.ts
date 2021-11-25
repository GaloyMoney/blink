import { toSats } from "@domain/bitcoin"
import {
  ExtendedLedgerTransactionType,
  isOnChainTransaction,
  LedgerTransactionType,
} from "@domain/ledger"
import { MEMO_SHARING_SATS_THRESHOLD } from "@config/app"
import { SettlementMethod, PaymentInitiationMethod } from "./tx-methods"
import { TxStatus } from "./tx-status"

const filterPendingIncoming = (
  walletId: WalletId,
  pendingTransactions: SubmittedTransaction[],
  addresses: OnChainAddress[],
  usdPerSat: UsdPerSat,
): WalletTransaction[] => {
  const walletTransactions: WalletTransaction[] = []
  pendingTransactions.forEach(({ rawTx, createdAt }) => {
    rawTx.outs.forEach(({ sats, address }) => {
      if (address && addresses.includes(address)) {
        walletTransactions.push({
          id: rawTx.txHash,
          walletId,
          initiationVia: PaymentInitiationMethod.OnChain,
          settlementVia: SettlementMethod.OnChain,
          deprecated: {
            description: "pending",
            usd: usdPerSat * sats,
            feeUsd: 0,
            type: LedgerTransactionType.OnchainReceipt,
          },
          otherPartyUsername: null,
          settlementFee: toSats(0),
          transactionHash: rawTx.txHash,
          status: TxStatus.Pending,
          memo: null,
          createdAt: createdAt,
          settlementAmount: sats,
          settlementUsdPerSat: usdPerSat,
          address,
        })
      }
    })
  })
  return walletTransactions
}

export const fromLedger = (
  ledgerTransactions: LedgerTransaction[],
): ConfirmedTransactionHistory => {
  const transactions: WalletTransaction[] = ledgerTransactions.map(
    ({
      id,
      walletId,
      memoFromPayer,
      lnMemo,
      type,
      credit,
      debit,
      fee,
      usd,
      feeUsd,
      paymentHash,
      txHash,
      pubkey,
      username,
      address,
      pendingConfirmation,
      timestamp,
    }) => {
      const settlementAmount = toSats(credit - debit)

      const description = translateDescription({
        type,
        memoFromPayer,
        lnMemo,
        credit,
        username,
      })

      const memo = translateMemo({
        memoFromPayer,
        lnMemo,
        credit,
      })

      const status = pendingConfirmation ? TxStatus.Pending : TxStatus.Success

      const baseTransaction = {
        id,
        walletId,
        settlementAmount,
        settlementFee: toSats(fee || 0),
        settlementUsdPerSat: Math.abs(usd / settlementAmount),
        status,
        memo,
        createdAt: timestamp,
        deprecated: {
          description,
          usd,
          feeUsd,
          type,
        },
      }

      let txType: ExtendedLedgerTransactionType = type
      if (type == LedgerTransactionType.IntraLedger && paymentHash) {
        txType = ExtendedLedgerTransactionType.LnIntraLedger
      }

      let walletTransaction: WalletTransaction
      switch (txType) {
        case ExtendedLedgerTransactionType.IntraLedger:
          walletTransaction = {
            ...baseTransaction,
            initiationVia: {
              type: PaymentInitiationMethod.IntraLedger,
              walletId: walletId as WalletId,
              counterPartyUsername: username as Username,
            },
            settlementVia: {
              type: SettlementMethod.IntraLedger,
              walletId: walletId as WalletId,
              counterPartyUsername: username as Username,
            },
          }
          return walletTransaction

        case ExtendedLedgerTransactionType.OnchainIntraLedger:
          walletTransaction = {
            ...baseTransaction,
            initiationVia: {
              type: PaymentInitiationMethod.OnChain,
              address,
            },
            settlementVia: {
              type: SettlementMethod.IntraLedger,
              walletId: walletId as WalletId,
              counterPartyUsername: username || null,
            },
          }
          return walletTransaction

        case ExtendedLedgerTransactionType.OnchainPayment:
        case ExtendedLedgerTransactionType.OnchainReceipt:
          walletTransaction = {
            ...baseTransaction,
            initiationVia: {
              type: PaymentInitiationMethod.OnChain,
              address,
            },
            settlementVia: {
              type: SettlementMethod.OnChain,
              transactionHash: txHash as OnChainTxHash,
            },
          }
          return walletTransaction

        case ExtendedLedgerTransactionType.LnIntraLedger:
          walletTransaction = {
            ...baseTransaction,
            initiationVia: {
              type: PaymentInitiationMethod.Lightning,
              paymentHash: paymentHash as PaymentHash,
              pubkey: pubkey as Pubkey,
            },
            settlementVia: {
              type: SettlementMethod.IntraLedger,
              walletId: walletId as WalletId,
              counterPartyUsername: username || null,
            },
          }
          return walletTransaction

        case ExtendedLedgerTransactionType.Payment:
        case ExtendedLedgerTransactionType.Invoice:
          walletTransaction = {
            ...baseTransaction,
            initiationVia: {
              type: PaymentInitiationMethod.Lightning,
              paymentHash: paymentHash as PaymentHash,
              pubkey: pubkey as Pubkey,
            },
            settlementVia: {
              type: SettlementMethod.Lightning,
              paymentSecret,
            },
          }
          return walletTransaction
      }

      walletTransaction = {
        ...baseTransaction,
        initiationVia: {
          type: PaymentInitiationMethod.IntraLedger,
          walletId: walletId as WalletId,
          counterPartyUsername: username as Username,
        },
        settlementVia: {
          type: SettlementMethod.IntraLedger,
          walletId: walletId as WalletId,
          counterPartyUsername: username || null,
        },
      }
      return walletTransaction
    },
  )

  return {
    transactions,
    addPendingIncoming: (
      walletId: WalletId,
      pendingIncoming: SubmittedTransaction[],
      addresses: OnChainAddress[],
      usdPerSat: UsdPerSat,
    ): WalletTransactionHistoryWithPending => ({
      transactions: [
        ...filterPendingIncoming(walletId, pendingIncoming, addresses, usdPerSat),
        ...transactions,
      ],
    }),
  }
}

const shouldDisplayMemo = (credit: number) => {
  return credit === 0 || credit >= MEMO_SHARING_SATS_THRESHOLD
}

export const translateDescription = ({
  memoFromPayer,
  lnMemo,
  username,
  type,
  credit,
}: {
  memoFromPayer?: string
  lnMemo?: string
  username?: string
  type: LedgerTransactionType
  credit: number
}): string => {
  if (shouldDisplayMemo(credit)) {
    if (memoFromPayer) {
      return memoFromPayer
    }
    if (lnMemo) {
      return lnMemo
    }
  }

  let usernameDescription
  if (username) {
    usernameDescription = `to ${username}`
    if (credit > 0) {
      usernameDescription = `from ${username}`
    }
  }

  return usernameDescription || type
}

export const translateMemo = ({
  memoFromPayer,
  lnMemo,
  credit,
}: {
  memoFromPayer?: string
  lnMemo?: string
  credit: number
}): string | null => {
  if (shouldDisplayMemo(credit)) {
    if (memoFromPayer) {
      return memoFromPayer
    }
    if (lnMemo) {
      return lnMemo
    }
  }

  return null
}

export const WalletTransactionHistory = {
  fromLedger,
} as const
