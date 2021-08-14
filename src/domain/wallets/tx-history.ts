import { toSats } from "@domain/bitcoin"
import { LedgerTransactionType } from "@domain/ledger"
import { MEMO_SHARING_SATS_THRESHOLD } from "@config/app"
import { SettlementMethod } from "./settlement-method"

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
          settlementVia: SettlementMethod.OnChain,
          old: {
            description: "pending",
            usd: usdPerSat * sats,
            feeUsd: 0,
            type: LedgerTransactionType.OnchainReceipt,
          },
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

export const confirmed = (
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
      if (type == LedgerTransactionType.OnchainIntraLedger && addresses) {
        return {
          id,
          settlementVia: SettlementMethod.IntraLedger,
          old: {
            description,
            usd,
            feeUsd,
            type,
          },
          settlementAmount,
          settlementFee: fee,
          paymentHash: null,
          addresses: addresses,
          recipientId: null,
          pendingConfirmation,
          createdAt: timestamp,
        }
      }
      if (type == LedgerTransactionType.IntraLedger) {
        return {
          id,
          settlementVia: SettlementMethod.IntraLedger,
          old: {
            description,
            usd,
            feeUsd,
            type,
          },
          settlementAmount,
          settlementFee: fee,
          paymentHash: (paymentHash as PaymentHash) || null,
          recipientId: username || null,
          addresses: null,
          pendingConfirmation,
          createdAt: timestamp,
        }
      } else if (addresses && addresses.length > 0) {
        return {
          id,
          settlementVia: SettlementMethod.OnChain,
          addresses,
          old: {
            description,
            usd,
            feeUsd,
            type,
          },
          settlementAmount,
          settlementFee: fee,
          pendingConfirmation,
          createdAt: timestamp,
        }
      }
      return {
        id,
        settlementVia: SettlementMethod.Lightning,
        old: {
          description,
          usd,
          feeUsd,
          type,
        },
        settlementAmount,
        settlementFee: fee,
        paymentHash: paymentHash as PaymentHash,
        username,
        pendingConfirmation,
        createdAt: timestamp,
      }
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
  return credit == 0 || credit >= MEMO_SHARING_SATS_THRESHOLD
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
    if (credit > 0) {
      usernameDescription = `from ${username}`
    } else {
      usernameDescription = `to ${username}`
    }
  }

  return usernameDescription || type
}

export const WalletTransactionHistory = {
  confirmed,
} as const
