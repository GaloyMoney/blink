import { toSats } from "@domain/bitcoin"
import { ExtendedLedgerTransactionType, LedgerTransactionType } from "@domain/ledger"
import { MEMO_SHARING_SATS_THRESHOLD, onboardingEarn } from "@config"

import { SettlementMethod, PaymentInitiationMethod } from "./tx-methods"
import { TxStatus } from "./tx-status"

const filterPendingIncoming = (
  walletId: WalletId,
  pendingTransactions: IncomingOnChainTransaction[],
  addresses: OnChainAddress[],
  usdPerSat: UsdPerSat,
): WalletOnChainTransaction[] => {
  const walletTransactions: WalletOnChainTransaction[] = []
  pendingTransactions.forEach(({ rawTx, createdAt }) => {
    rawTx.outs.forEach(({ sats, address }) => {
      if (address && addresses.includes(address)) {
        walletTransactions.push({
          id: rawTx.txHash,
          walletId,
          settlementAmount: sats,
          settlementFee: toSats(0),
          settlementUsdPerSat: usdPerSat,
          status: TxStatus.Pending,
          memo: null,
          createdAt: createdAt,
          deprecated: {
            description: "pending",
            usd: usdPerSat * sats,
            feeUsd: 0,
            type: LedgerTransactionType.OnchainReceipt,
          },
          initiationVia: {
            type: PaymentInitiationMethod.OnChain,
            address,
          },
          settlementVia: {
            type: SettlementMethod.OnChain,
            transactionHash: rawTx.txHash,
          },
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
      recipientWalletId,
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
      revealedPreImage,
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

      const defaultOnChainAddress = "<no-address>" as OnChainAddress

      let walletTransaction: WalletTransaction
      switch (txType) {
        case ExtendedLedgerTransactionType.IntraLedger:
          walletTransaction = {
            ...baseTransaction,
            initiationVia: {
              type: PaymentInitiationMethod.IntraLedger,
              counterPartyWalletId: recipientWalletId as WalletId,
              counterPartyUsername: username as Username,
            },
            settlementVia: {
              type: SettlementMethod.IntraLedger,
              counterPartyWalletId: recipientWalletId as WalletId,
              counterPartyUsername: username as Username,
            },
          }
          return walletTransaction

        case ExtendedLedgerTransactionType.OnchainIntraLedger:
          walletTransaction = {
            ...baseTransaction,
            initiationVia: {
              type: PaymentInitiationMethod.OnChain,
              address: address || defaultOnChainAddress,
            },
            settlementVia: {
              type: SettlementMethod.IntraLedger,
              counterPartyWalletId: recipientWalletId as WalletId,
              counterPartyUsername: username,
            },
          }
          return walletTransaction

        case ExtendedLedgerTransactionType.OnchainPayment:
        case ExtendedLedgerTransactionType.OnchainReceipt:
          walletTransaction = {
            ...baseTransaction,
            initiationVia: {
              type: PaymentInitiationMethod.OnChain,
              address: address || defaultOnChainAddress,
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
              counterPartyWalletId: recipientWalletId as WalletId,
              counterPartyUsername: username,
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
              revealedPreImage,
            },
          }
          return walletTransaction
      }

      walletTransaction = {
        ...baseTransaction,
        initiationVia: {
          type: PaymentInitiationMethod.IntraLedger,
          counterPartyWalletId: recipientWalletId as WalletId,
          counterPartyUsername: username as Username,
        },
        settlementVia: {
          type: SettlementMethod.IntraLedger,
          counterPartyWalletId: recipientWalletId as WalletId,
          counterPartyUsername: username,
        },
      }
      return walletTransaction
    },
  )

  return {
    transactions,
    addPendingIncoming: (
      walletId: WalletId,
      pendingIncoming: IncomingOnChainTransaction[],
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

const shouldDisplayMemo = ({
  memo,
  credit,
}: {
  memo: string | undefined
  credit: number
}) => {
  return isAuthorizedMemo(memo) || credit === 0 || credit >= MEMO_SHARING_SATS_THRESHOLD
}

const isAuthorizedMemo = (memo: string | undefined): boolean =>
  !!memo && Object.keys(onboardingEarn).includes(memo)

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
  if (shouldDisplayMemo({ memo: memoFromPayer, credit })) {
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
  if (shouldDisplayMemo({ memo: memoFromPayer, credit })) {
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
