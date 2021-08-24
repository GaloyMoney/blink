import { toSats } from "@domain/bitcoin"
import { LedgerTransactionType } from "@domain/ledger"
import { MEMO_SHARING_SATS_THRESHOLD } from "@config/app"
import { SettlementMethod, PaymentInitiationMethod } from "./tx-methods"

const filterPendingIncoming = (
  pendingTransactions: SubmittedTransaction[],
  addresses: OnChainAddress[],
  usdPerSat: UsdPerSat,
): WalletTransaction[] => {
  const walletTransactions: WalletTransaction[] = []
  pendingTransactions.forEach(({ rawTx, createdAt }) => {
    rawTx.outs.forEach(({ sats, address }) => {
      if (address && addresses.includes(address)) {
        walletTransactions.push({
          id: rawTx.id,
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
  return walletTransactions
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
      walletname,
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
        walletname,
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
          recipientId: walletname || null,
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
          recipientId: walletname || null,
          pendingConfirmation,
          createdAt: timestamp,
        }
      }
      return {
        id,
        initiationVia: PaymentInitiationMethod.Walletname,
        settlementVia: SettlementMethod.IntraLedger,
        deprecated: {
          description,
          usd,
          feeUsd,
          type,
        },
        settlementAmount,
        settlementFee: toSats(fee || 0),
        recipientId: walletname || null,
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
    ): WalletTransactionHistoryWithPending => ({
      transactions: [
        ...filterPendingIncoming(pendingIncoming, addresses, usdPerSat),
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
  walletname,
  type,
  credit,
}: {
  memoFromPayer?: string
  lnMemo?: string
  walletname?: string
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

  let walletnameDescription
  if (walletname) {
    walletnameDescription = `to ${walletname}`
    if (credit > 0) {
      walletnameDescription = `from ${walletname}`
    }
  }

  return walletnameDescription || type
}

export const WalletTransactionHistory = {
  fromLedger,
} as const
