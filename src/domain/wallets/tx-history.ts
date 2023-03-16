import {
  MEMO_SHARING_CENTS_THRESHOLD,
  MEMO_SHARING_SATS_THRESHOLD,
  OnboardingEarn,
} from "@config"

import {
  DisplayCurrency,
  minorToMajorUnit,
  minorToMajorUnitFormatted,
  toCents,
} from "@domain/fiat"
import { toSats } from "@domain/bitcoin"
import { WalletCurrency } from "@domain/shared"
import { AdminLedgerTransactionType, LedgerTransactionType } from "@domain/ledger"

import { TxStatus } from "./tx-status"
import { DepositFeeCalculator } from "./deposit-fee-calculator"
import { PaymentInitiationMethod, SettlementMethod } from "./tx-methods"
import { SettlementAmounts } from "./settlement-amounts"

const filterPendingIncoming = <S extends WalletCurrency, T extends DisplayCurrency>({
  pendingIncoming,
  addressesByWalletId,
  walletDetailsByWalletId,
}: AddPendingIncomingArgs<S, T>): WalletOnChainTransaction[] => {
  const walletTransactions: WalletOnChainTransaction[] = []
  pendingIncoming.forEach(({ rawTx, createdAt }) => {
    rawTx.outs.forEach(({ sats, address }) => {
      if (address) {
        for (const walletIdString in addressesByWalletId) {
          const walletId = walletIdString as WalletId
          const {
            walletCurrency,
            walletPriceRatio,
            depositFeeRatio,
            displayCurrency,
            displayPriceRatio,
          } = walletDetailsByWalletId[walletId]

          if (addressesByWalletId[walletId].includes(address)) {
            const fee = DepositFeeCalculator().onChainDepositFee({
              amount: sats,
              ratio: depositFeeRatio,
            })
            const btcFeeAmount = {
              amount: BigInt(fee),
              currency: WalletCurrency.Btc,
            }

            const settlementAmountSats = toSats(sats - fee)
            const btcSettlementAmount = {
              amount: BigInt(settlementAmountSats),
              currency: WalletCurrency.Btc,
            }

            const settlementAmount =
              walletCurrency === WalletCurrency.Btc
                ? settlementAmountSats
                : walletPriceRatio === undefined // This should not be 'undefined' when walletCurrency === "USD"
                ? toCents(0)
                : toCents(walletPriceRatio.convertFromBtc(btcSettlementAmount).amount)

            const settlementFee =
              walletCurrency === WalletCurrency.Btc
                ? fee
                : walletPriceRatio === undefined // This should not be 'undefined' when walletCurrency === "USD"
                ? toCents(0)
                : toCents(walletPriceRatio.convertFromBtcToCeil(btcFeeAmount).amount)

            let settlementDisplayAmount = `${NaN}`
            let settlementDisplayFee = `${NaN}`
            let displayCurrencyPerSettlementCurrencyMajorUnit = NaN as number
            if (displayPriceRatio) {
              const displayAmount =
                displayPriceRatio.convertFromWallet(btcSettlementAmount)
              const displayCurrency = displayAmount.currency
              settlementDisplayAmount = minorToMajorUnitFormatted({
                amount: displayAmount.amountInMinor,
                displayCurrency,
              })

              const displayFee = displayPriceRatio.convertFromWalletToCeil(btcFeeAmount)
              settlementDisplayFee = minorToMajorUnitFormatted({
                amount: displayFee.amountInMinor,
                displayCurrency,
              })

              displayCurrencyPerSettlementCurrencyMajorUnit = minorToMajorUnit({
                amount: displayPriceRatio.displayMinorUnitPerWalletUnit(),
                displayCurrency,
                fixed: false,
              })
            }

            walletTransactions.push({
              id: rawTx.txHash,
              walletId,
              settlementAmount,
              settlementFee,
              settlementCurrency: walletCurrency,
              settlementDisplayAmount,
              settlementDisplayFee,
              settlementDisplayCurrency: displayCurrency,
              displayCurrencyPerSettlementCurrencyUnit:
                displayCurrencyPerSettlementCurrencyMajorUnit,
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

const translateLedgerTxnToWalletTxn = <S extends WalletCurrency>({
  txn,
  nonEndUserWalletIds,
}: {
  txn: LedgerTransaction<S>
  nonEndUserWalletIds: WalletId[]
}): WalletTransaction => {
  const {
    type,
    credit,
    currency,
    satsAmount: satsAmountRaw,
    satsFee: satsFeeRaw,
    centsAmount: centsAmountRaw,
    centsFee: centsFeeRaw,
    displayAmount: displayAmountRaw,
    displayFee: displayFeeRaw,
    displayCurrency,
    lnMemo,
    memoFromPayer,
    journalId,
    walletId,
  } = txn

  const isAdmin = Object.values(AdminLedgerTransactionType).includes(
    type as AdminLedgerTransactionType,
  )

  const { settlementAmount, settlementDisplayAmount, settlementDisplayFee } =
    SettlementAmounts().fromTxn(txn)

  let satsAmount = satsAmountRaw || 0
  let centsAmount = centsAmountRaw || 0
  let displayAmount = displayAmountRaw || 0
  let displayFee = displayFeeRaw || 0
  let satsFee = satsFeeRaw || 0
  let centsFee = centsFeeRaw || 0
  // Temp admin checks, to be removed when usd/feeUsd/fee fields are deprecated
  if (isAdmin) {
    displayAmount = txn.usd ? Math.round(txn.usd * 100) : 0
    displayFee = txn.feeUsd ? Math.round(txn.feeUsd * 100) : 0
    satsAmount = Math.abs(settlementAmount)
    satsFee = txn.fee || 0
    centsAmount = displayAmount
    centsFee = displayFee
  }

  const memo = translateMemo({
    memoFromPayer,
    lnMemo,
    credit,
    currency,
    walletId,
    nonEndUserWalletIds,
    journalId,
  })

  const status = txn.pendingConfirmation ? TxStatus.Pending : TxStatus.Success

  const baseTransaction: BaseWalletTransaction = {
    id: txn.id,
    walletId: txn.walletId,
    settlementAmount,
    settlementFee: currency === WalletCurrency.Btc ? toSats(satsFee) : toCents(centsFee),
    settlementCurrency: txn.currency,
    settlementDisplayAmount,
    settlementDisplayFee,
    settlementDisplayCurrency: displayCurrency || DisplayCurrency.Usd,
    displayCurrencyPerSettlementCurrencyUnit: displayCurrencyPerBaseUnitFromAmounts({
      displayAmount,
      baseAmount: txn.currency === WalletCurrency.Btc ? satsAmount : centsAmount,
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
          revealedPreImage: undefined, // is added by dataloader in resolver
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

const fromLedger = <S extends WalletCurrency, T extends DisplayCurrency>({
  ledgerTransactions,
  nonEndUserWalletIds,
}: {
  ledgerTransactions: LedgerTransaction<S>[]
  nonEndUserWalletIds: WalletId[]
}): ConfirmedTransactionHistory<S, T> => {
  const transactions = ledgerTransactions.map((txn) =>
    translateLedgerTxnToWalletTxn({ txn, nonEndUserWalletIds }),
  )

  return {
    transactions,
    addPendingIncoming: (args) => ({
      transactions: [...filterPendingIncoming(args), ...transactions],
    }),
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
  !!memo && Object.keys(OnboardingEarn).includes(memo)

export const translateMemo = ({
  memoFromPayer,
  lnMemo,
  credit,
  currency,
  walletId,
  nonEndUserWalletIds,
  journalId,
}: {
  memoFromPayer?: string
  lnMemo?: string
  credit: CurrencyBaseAmount
  currency: WalletCurrency
  walletId: WalletId | undefined
  nonEndUserWalletIds: WalletId[]
  journalId: LedgerJournalId
}): string | null => {
  if (walletId && nonEndUserWalletIds.includes(walletId)) {
    return `JournalId:${journalId}`
  }

  const memo = memoFromPayer || lnMemo
  if (shouldDisplayMemo({ memo, credit, currency })) {
    return memo || null
  }

  return null
}

export const WalletTransactionHistory = {
  fromLedger,
} as const

// TODO: refactor this to use WalletPriceRatio eventually instead after
// 'usd' property removal from db
const displayCurrencyPerBaseUnitFromAmounts = ({
  displayAmount,
  baseAmount,
}: {
  displayAmount: number
  baseAmount: number
}): number => {
  if (baseAmount === 0) {
    return 0
  }

  const majorExponent = 2
  const priceInMinorUnit = displayAmount / baseAmount
  return Number(priceInMinorUnit / 10 ** majorExponent)
}
