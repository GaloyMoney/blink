import { MEMO_SHARING_SATS_THRESHOLD, onboardingEarn } from "@config"
import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { ExtendedLedgerTransactionType, LedgerTransactionType } from "@domain/ledger"
import { WalletCurrency } from "@domain/shared"

import { PaymentInitiationMethod, SettlementMethod } from "./tx-methods"
import { TxStatus } from "./tx-status"

const filterPendingIncoming = (
  pendingTransactions: IncomingOnChainTransaction[],
  addressesByWalletId: { [key: WalletId]: OnChainAddress[] },
  walletDetailsByWalletId: { [key: WalletId]: { currency: WalletCurrency } },
  displayCurrencyPerSat: DisplayCurrencyPerSat,
): WalletOnChainTransaction[] => {
  const walletTransactions: WalletOnChainTransaction[] = []
  pendingTransactions.forEach(({ rawTx, createdAt }) => {
    rawTx.outs.forEach(({ sats, address }) => {
      if (address) {
        for (const walletIdString in addressesByWalletId) {
          const walletId = walletIdString as WalletId
          if (addressesByWalletId[walletId].includes(address)) {
            walletTransactions.push({
              id: rawTx.txHash,
              walletId,
              settlementAmount: sats,
              settlementFee: toSats(0),
              settlementCurrency: walletDetailsByWalletId[walletId].currency,
              displayCurrencyPerSettlementCurrencyUnit: displayCurrencyPerSat,
              status: TxStatus.Pending,
              memo: null,
              createdAt: createdAt,
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
        }
      }
    })
  })
  return walletTransactions
}

export const fromLedger = (
  ledgerTransactions: LedgerTransaction<WalletCurrency>[],
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
      username,
      address,
      pendingConfirmation,
      timestamp,
      currency,
    }) => {
      const settlementAmount =
        currency === WalletCurrency.Btc ? toSats(credit - debit) : toCents(credit - debit)
      const settlementFee =
        currency === WalletCurrency.Btc
          ? toSats(fee || 0)
          : toCents(feeUsd ? Math.floor(feeUsd * 100) : 0)

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
        settlementFee,
        settlementCurrency: currency,
        displayCurrencyPerSettlementCurrencyUnit: displayCurrencyPerBaseUnitFromAmounts({
          displayAmountAsNumber: usd,
          settlementAmountInBaseAsNumber: settlementAmount,
        }),
        status,
        memo,
        createdAt: timestamp,
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
              revealedPreImage: null,
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
          counterPartyUsername: username || null,
        },
      }
      return walletTransaction
    },
  )

  return {
    transactions,
    addPendingIncoming: ({
      pendingIncoming,
      addressesByWalletId,
      walletDetailsByWalletId,
      displayCurrencyPerSat,
    }: AddPendingIncomingArgs): WalletTransactionHistoryWithPending => ({
      transactions: [
        ...filterPendingIncoming(
          pendingIncoming,
          addressesByWalletId,
          walletDetailsByWalletId,
          displayCurrencyPerSat,
        ),
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

// TODO: refactor this to use PriceRatio eventually instead after
// 'usd' property removal from db
const displayCurrencyPerBaseUnitFromAmounts = ({
  displayAmountAsNumber,
  settlementAmountInBaseAsNumber,
}: {
  displayAmountAsNumber: number
  settlementAmountInBaseAsNumber: number
}): number =>
  settlementAmountInBaseAsNumber === 0
    ? 0
    : Math.abs(displayAmountAsNumber / settlementAmountInBaseAsNumber)
