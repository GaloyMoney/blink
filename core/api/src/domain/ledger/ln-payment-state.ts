import { InvalidLnPaymentTxnsBundleError, LedgerTransactionType } from "."

export const FAILED_USD_MEMO = "Usd payment canceled"

export const LnPaymentState = {
  Pending: "ln_payment.pending",
  PendingAfterRetry: "ln_payment.pending_after_retry",
  Success: "ln_payment.success",
  SuccessWithReimbursement: "ln_payment.success_with_reimbursement",
  SuccessAfterRetry: "ln_payment.success_after_retry",
  SuccessWithReimbursementAfterRetry: "ln_payment.success_with_reimbursement_after_retry",
  Failed: "ln_payment.failed",
  FailedAfterRetry: "ln_payment.failed_after_retry",
  FailedAfterSuccess: "ln_payment.failed_after_success",
  FailedAfterSuccessWithReimbursement:
    "ln_payment.failed_after_success_with_reimbursement",
} as const

const isDebit = (txn: LedgerTransaction<WalletCurrency>) => (txn.debit || 0) > 0

const bundleErrMsg = ({
  msg,
  txns,
}: {
  msg: string
  txns: LedgerTransaction<WalletCurrency>[]
}) =>
  JSON.stringify({
    msg,
    txns: txns.map((tx) => ({
      id: tx.id,
      journalId: tx.journalId,
      type: tx.type,
      pendingConfirmation: tx.pendingConfirmation,
      currency: tx.currency,
      debit: tx.debit,
      credit: tx.credit,
      lnMemo: tx.lnMemo,
    })),
  })

const checkTxns = (
  txns: LedgerTransaction<WalletCurrency>[],
): true | InvalidLnPaymentTxnsBundleError => {
  const validTypes = [
    LedgerTransactionType.Payment,
    LedgerTransactionType.LnFeeReimbursement,
  ]
  for (const txn of txns) {
    if (!validTypes.includes(txn.type as (typeof validTypes)[number])) {
      return new InvalidLnPaymentTxnsBundleError(
        bundleErrMsg({ msg: `Invalid '${txn.type}' type found`, txns }),
      )
    }
  }

  if (txns.length === 0) return new InvalidLnPaymentTxnsBundleError("No txns in bundle")

  return true
}

const sortTxnsByTimestampDesc = (txns: LedgerTransaction<WalletCurrency>[]) =>
  txns.sort((txA, txB) => txB.timestamp.getTime() - txA.timestamp.getTime())

export const LnPaymentStateDeterminator = (
  unsortedTxns: LedgerTransaction<WalletCurrency>[],
): LnPaymentStateDeterminator => {
  const determine = (): LnPaymentState | InvalidLnPaymentTxnsBundleError => {
    const check = checkTxns(unsortedTxns)
    if (check instanceof Error) return check

    const txns = sortTxnsByTimestampDesc(unsortedTxns)

    // Pending txns
    const pendingTxns = txns.filter((tx) => tx.pendingConfirmation)
    if (pendingTxns.length) {
      switch (true) {
        case txns.length === 1:
          return LnPaymentState.Pending

        case txns.length % 2 === 1 && pendingTxns.length === 1:
          return LnPaymentState.PendingAfterRetry

        default:
          return new InvalidLnPaymentTxnsBundleError(
            bundleErrMsg({ msg: "There should be only 1 pending txn", txns }),
          )
      }
    }

    // LnFeeReimbursement txns
    const reimburseTxns = txns.filter(
      (tx) => tx.type === LedgerTransactionType.LnFeeReimbursement,
    )
    if (reimburseTxns.length) {
      const paymentTypeTxns = txns.filter(
        (tx) => tx.type === LedgerTransactionType.Payment,
      )

      const txnsAfterReimburse = txns.filter(
        (tx) => tx.timestamp > reimburseTxns[0].timestamp,
      )

      switch (true) {
        case paymentTypeTxns.length === 1:
          return LnPaymentState.SuccessWithReimbursement

        case !!txnsAfterReimburse.length:
          return LnPaymentState.FailedAfterSuccessWithReimbursement

        case paymentTypeTxns.length > 1 && reimburseTxns.length === 1:
          return LnPaymentState.SuccessWithReimbursementAfterRetry

        default:
          return new InvalidLnPaymentTxnsBundleError(
            bundleErrMsg({
              msg: "There should be payment txns and only 1 reimbursement txn",
              txns,
            }),
          )
      }
    }

    // Pure success and fail txns
    switch (true) {
      case txns.length === 1:
        return LnPaymentState.Success

      case txns.length === 2:
        return LnPaymentState.Failed

      case txns.length % 2 === 1 && isDebit(txns[0]):
        return LnPaymentState.SuccessAfterRetry

      case txns.length % 2 === 1:
        return LnPaymentState.FailedAfterSuccess

      case txns.length % 2 === 0:
        return LnPaymentState.FailedAfterRetry

      default:
        return new InvalidLnPaymentTxnsBundleError(
          bundleErrMsg({ msg: "Impossible state", txns }),
        )
    }
  }

  return { determine }
}
