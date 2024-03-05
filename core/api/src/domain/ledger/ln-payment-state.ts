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
} as const

const count = <T>({ arr, valueToCount }: { arr: T[]; valueToCount: T }): number =>
  arr.reduce((count, currentValue) => {
    return currentValue === valueToCount ? count + 1 : count
  }, 0)

const sum = <T>({ arr, propertyName }: { arr: T[]; propertyName: keyof T }): number =>
  arr.reduce((sum, currentItem) => {
    return sum + Number(currentItem[propertyName])
  }, 0)

const checkTxns = (
  txns: LedgerTransaction<WalletCurrency>[],
): true | InvalidLnPaymentTxnsBundleError => {
  const validTypes = [
    LedgerTransactionType.Payment,
    LedgerTransactionType.LnFeeReimbursement,
  ]
  for (const txn of txns) {
    if (!validTypes.includes(txn.type as (typeof validTypes)[number])) {
      return new InvalidLnPaymentTxnsBundleError(`Invalid '${txn.type}' type found`)
    }
  }

  if (txns.length === 0) return new InvalidLnPaymentTxnsBundleError("No txns in bundle")

  return true
}

export const LnPaymentStateDeterminator = (
  txns: LedgerTransaction<WalletCurrency>[],
): LnPaymentStateDeterminator => {
  const determine = (): LnPaymentState | InvalidLnPaymentTxnsBundleError => {
    const check = checkTxns(txns)
    if (check instanceof Error) return check

    const txPendingStates = txns.map((txn) => txn.pendingConfirmation)
    if (txPendingStates.includes(true)) {
      const pendingCount = count({ arr: txPendingStates, valueToCount: true })

      switch (true) {
        case txns.length === 1:
          return LnPaymentState.Pending

        case txns.length % 2 === 1 && pendingCount === 1:
          return LnPaymentState.PendingAfterRetry

        default:
          return new InvalidLnPaymentTxnsBundleError()
      }
    }

    const txTypes = txns.map((txn) => txn.type)
    const txPaymentCount = count({
      arr: txTypes,
      valueToCount: LedgerTransactionType.Payment,
    })
    if (txTypes.includes(LedgerTransactionType.LnFeeReimbursement)) {
      const txReimburseCount = count({
        arr: txTypes,
        valueToCount: LedgerTransactionType.LnFeeReimbursement,
      })
      switch (true) {
        case txPaymentCount === 1 && txReimburseCount === 1:
          return LnPaymentState.SuccessWithReimbursement
        case txPaymentCount > 1 && txReimburseCount === 1:
          return LnPaymentState.SuccessWithReimbursementAfterRetry
        default:
          return new InvalidLnPaymentTxnsBundleError()
      }
    }

    const sumTxAmounts =
      sum({ arr: txns, propertyName: "debit" }) -
      sum({ arr: txns, propertyName: "credit" })
    const failedUsdPayment = !!txns.find((tx) => tx.lnMemo === FAILED_USD_MEMO)
    // FIXME: 'failedUsdPayment' is a brittle check, but voided can't be used because
    //        we don't currently mark failed usd entries as void.
    switch (true) {
      case txns.length === 1:
        return LnPaymentState.Success

      case txns.length === 2 && (sumTxAmounts === 0 || failedUsdPayment):
        return LnPaymentState.Failed

      case txns.length % 2 === 1:
        return LnPaymentState.SuccessAfterRetry

      case txns.length % 2 === 0 && (sumTxAmounts === 0 || failedUsdPayment):
        return LnPaymentState.FailedAfterRetry

      default:
        return new InvalidLnPaymentTxnsBundleError()
    }
  }

  return { determine }
}
