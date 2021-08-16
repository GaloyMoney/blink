import { toSats } from "@domain/bitcoin"
import { LedgerTransactionType } from "@domain/ledger"
import { MEMO_SHARING_SATS_THRESHOLD } from "@config/app"
import { SettlementMethod, PaymentInitiationMethod } from "./tx-methods"

const addPendingIncoming = (
  confirmedTransactions: WalletTransaction[],
  pendingTransactions: SubmittedTransaction[],
  addresses: OnChainAddress[],
  usdPerSat: UsdPerSat,
): WalletTransactionHistoryWithPending => {
  const walletTransactions: WalletTransaction[] = []
  pendingTransactions.forEach(({ id, rawTx, createdAt }) => {
    rawTx.outs.forEach(({ sats, address }) => {
      if (addresses.includes(address)) {
        walletTransactions.push({
          id,
          initiationVia: PaymentInitiationMethod.OnChain,
          settlementVia: SettlementMethod.OnChain,
          deprecated: {
            description: "pending",
            usd: usdPerSat * sats,
            feeUsd: 0,
            type: LedgerTransactionType.OnchainReceipt,
          },
          recipientId: null,
          settlementFee: toSats(0),
          pendingConfirmation: true,
          createdAt: createdAt,
          settlementAmount: sats,
          addresses: [address],
        })
      }
    })
  })
  return {
    transactions: [...walletTransactions, ...confirmedTransactions],
  }
}

export const fromLedger = (
  ledgerTransactions: LedgerTransaction[],
): ConfirmedTransactionHistory => {
  const transactions = ledgerTransactions.map(
    ({
      id,
      memoFromPayer,
      lnMemo,
      type,
      credit,
      debit,
      fee,
      usd,
      feeUsd,
      paymentHash,
      username,
      addresses,
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
      if (addresses && addresses.length > 0) {
        return {
          id,
          initiationVia: PaymentInitiationMethod.OnChain,
          settlementVia:
            type === LedgerTransactionType.OnchainIntraLedger
              ? SettlementMethod.IntraLedger
              : SettlementMethod.OnChain,
          addresses,
          deprecated: {
            description,
            usd,
            feeUsd,
            type,
          },
          recipientId: username || null,
          settlementAmount,
          settlementFee: toSats(fee || 0),
          pendingConfirmation,
          createdAt: timestamp,
        }
      }
      if (paymentHash) {
        return {
          id,
          initiationVia: PaymentInitiationMethod.Lightning,
          settlementVia:
            type === LedgerTransactionType.IntraLedger
              ? SettlementMethod.IntraLedger
              : SettlementMethod.Lightning,
          deprecated: {
            description,
            usd,
            feeUsd,
            type,
          },
          settlementAmount,
          settlementFee: toSats(fee || 0),
          paymentHash: paymentHash as PaymentHash,
          recipientId: username || null,
          pendingConfirmation,
          createdAt: timestamp,
        }
      }
      return {
        id,
        initiationVia: PaymentInitiationMethod.Username,
        settlementVia: SettlementMethod.IntraLedger,
        deprecated: {
          description,
          usd,
          feeUsd,
          type,
        },
        settlementAmount,
        settlementFee: toSats(fee || 0),
        recipientId: username || null,
        pendingConfirmation,
        createdAt: timestamp,
      } as UsernameTransaction
    },
  )
  return {
    transactions,
    addPendingIncoming: (
      pendingIncoming: SubmittedTransaction[],
      addresses: OnChainAddress[],
      usdPerSat: UsdPerSat,
    ) => addPendingIncoming(transactions, pendingIncoming, addresses, usdPerSat),
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

export const WalletTransactionHistory = {
  fromLedger,
} as const
