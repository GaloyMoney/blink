import {
  MEMO_SHARING_CENTS_THRESHOLD,
  MEMO_SHARING_SATS_THRESHOLD,
  onboardingEarn,
} from "@config"
import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { LedgerTransactionType } from "@domain/ledger"
import { WalletCurrency } from "@domain/shared"

import { PaymentInitiationMethod, SettlementMethod } from "./tx-methods"
import { TxStatus } from "./tx-status"

const filterPendingIncoming = ({
  pendingIncoming,
  addressesByWalletId,
  walletDetailsByWalletId,
  displayCurrencyPerSat,
}: AddPendingIncomingArgs): WalletOnChainTransaction[] => {
  const walletTransactions: WalletOnChainTransaction[] = []
  pendingIncoming.forEach(({ rawTx, createdAt }) => {
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

const translateLedgerTxnToWalletTxn = <S extends WalletCurrency>(
  txn: LedgerTransaction<S>,
) => {
  const { credit, debit, currency, fee, feeUsd, lnMemo, memoFromPayer } = txn
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
    currency,
  })

  const status = txn.pendingConfirmation ? TxStatus.Pending : TxStatus.Success

  const baseTransaction = {
    id: txn.id,
    walletId: txn.walletId,
    settlementAmount,
    settlementFee,
    settlementCurrency: txn.currency,
    displayCurrencyPerSettlementCurrencyUnit: displayCurrencyPerBaseUnitFromAmounts({
      displayAmountAsNumber: txn.usd,
      settlementAmountInBaseAsNumber: settlementAmount,
    }),
    status,
    memo,
    createdAt: txn.timestamp,
  }

  let txType = txn.type
  if (txn.type == LedgerTransactionType.IntraLedger && txn.paymentHash) {
    txType = LedgerTransactionType.LnIntraLedger
  }

  const defaultOnChainAddress = "<no-address>" as OnChainAddress

  const { recipientWalletId, username, pubkey, paymentHash, txHash, address } = txn

  let walletTransaction: WalletTransaction
  switch (txType) {
    case LedgerTransactionType.IntraLedger:
    case LedgerTransactionType.WalletIdTradeIntraAccount:
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
      break

    case LedgerTransactionType.OnchainIntraLedger:
    case LedgerTransactionType.OnChainTradeIntraAccount:
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
      break

    case LedgerTransactionType.OnchainPayment:
    case LedgerTransactionType.OnchainReceipt:
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
      break

    case LedgerTransactionType.LnIntraLedger:
    case LedgerTransactionType.LnTradeIntraAccount:
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
      break

    case LedgerTransactionType.Payment:
    case LedgerTransactionType.Invoice:
      walletTransaction = {
        ...baseTransaction,
        initiationVia: {
          type: PaymentInitiationMethod.Lightning,
          paymentHash: paymentHash as PaymentHash,
          pubkey: pubkey as Pubkey,
        },
        settlementVia: {
          type: SettlementMethod.Lightning,
          revealedPreImage: undefined,
        },
      }
      break

    default:
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
  }

  return walletTransaction
}

const translateLedgerTxnToWalletTxnWithMetadata = <S extends WalletCurrency>(
  txn: LedgerTransactionWithMetadata<S>,
): WalletTransactionWithMetadata => {
  const walletTxn = translateLedgerTxnToWalletTxn(txn)

  let walletTxnWithMetadata: WalletTransactionWithMetadata = {
    hasMetadata: true,
    ...walletTxn,
  }
  if ("revealedPreImage" in txn) {
    if (walletTxnWithMetadata.settlementVia.type !== SettlementMethod.Lightning) {
      // TODO: return invalid-state error here and remove cast to 'WalletLnTransactionWithMetadata' just below
    }

    walletTxnWithMetadata = {
      ...walletTxnWithMetadata,
      settlementVia: {
        ...walletTxnWithMetadata.settlementVia,
        revealedPreImage: txn.revealedPreImage,
      },
    } as WalletLnTransactionWithMetadata
  }

  return walletTxnWithMetadata
}

const fromLedger = (
  ledgerTransactions: LedgerTransaction<WalletCurrency>[],
): ConfirmedTransactionHistory => {
  const transactions = ledgerTransactions.map(translateLedgerTxnToWalletTxn)

  return {
    transactions,
    addPendingIncoming: (args) => ({
      transactions: [...filterPendingIncoming(args), ...transactions],
    }),
  }
}

const fromLedgerWithMetadata = <S extends WalletCurrency>(
  ledgerTransactions: LedgerTransactionWithMetadata<S>[],
): ConfirmedTransactionHistoryWithMetadata => {
  const transactions = ledgerTransactions.map(translateLedgerTxnToWalletTxnWithMetadata)

  const addPendingIncoming = (args: AddPendingIncomingArgs) => {
    const pendingTxnsWithMetadata = filterPendingIncoming(args).map(
      (txn: WalletTransaction): WalletTransactionWithMetadata => ({
        ...txn,
        hasMetadata: true,
      }),
    )

    return {
      transactions: [...pendingTxnsWithMetadata, ...transactions],
    }
  }

  return {
    transactions,
    addPendingIncoming,
  }
}

const shouldDisplayMemo = ({
  memo,
  credit,
  currency,
}: {
  memo: string | undefined
  credit: CurrencyBaseAmount
  currency: WalletCurrency
}) => {
  if (isAuthorizedMemo(memo) || credit === 0) return true

  if (currency === WalletCurrency.Btc) return credit >= MEMO_SHARING_SATS_THRESHOLD

  return credit >= MEMO_SHARING_CENTS_THRESHOLD
}

const isAuthorizedMemo = (memo: string | undefined): boolean =>
  !!memo && Object.keys(onboardingEarn).includes(memo)

export const translateMemo = ({
  memoFromPayer,
  lnMemo,
  credit,
  currency,
}: {
  memoFromPayer?: string
  lnMemo?: string
  credit: CurrencyBaseAmount
  currency: WalletCurrency
}): string | null => {
  const memo = memoFromPayer || lnMemo
  if (shouldDisplayMemo({ memo, credit, currency })) {
    return memo || null
  }

  return null
}

export const WalletTransactionHistory = {
  fromLedger,
  fromLedgerWithMetadata,
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
