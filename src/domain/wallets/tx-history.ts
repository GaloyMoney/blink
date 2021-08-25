import { toSats } from "@domain/bitcoin"
import { LedgerTransactionType } from "@domain/ledger"
import { MEMO_SHARING_SATS_THRESHOLD } from "@config/app"
import { SettlementMethod, PaymentInitiationMethod } from "./tx-methods"
import { TxStatus } from "./tx-status"

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
          status: TxStatus.Pending,
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
      walletName,
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
        walletName,
      })
      const status = pendingConfirmation ? TxStatus.Pending : TxStatus.Success
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
          recipientId: walletName || null,
          settlementAmount,
          settlementFee: toSats(fee || 0),
          status,
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
          recipientId: walletName || null,
          status,
          createdAt: timestamp,
        }
      }
      return {
        id,
        initiationVia: PaymentInitiationMethod.WalletName,
        settlementVia: SettlementMethod.IntraLedger,
        deprecated: {
          description,
          usd,
          feeUsd,
          type,
        },
        settlementAmount,
        settlementFee: toSats(fee || 0),
        recipientId: walletName || null,
        status,
        createdAt: timestamp,
      } as WalletNameTransaction
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
  walletName,
  type,
  credit,
}: {
  memoFromPayer?: string
  lnMemo?: string
  walletName?: string
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

  let walletNameDescription
  if (walletName) {
    walletNameDescription = `to ${walletName}`
    if (credit > 0) {
      walletNameDescription = `from ${walletName}`
    }
  }

  return walletNameDescription || type
}

export const WalletTransactionHistory = {
  fromLedger,
} as const
