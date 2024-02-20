import { InvalidLnPaymentTxnsBundleError, LedgerTransactionType } from "."

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

export const LnPaymentStateDeterminator = (
  txns: LedgerTransaction<WalletCurrency>[],
): LnPaymentStateDeterminator => {
  const determine = (): LnPaymentState | InvalidLnPaymentTxnsBundleError => {
    if (txns.length === 0) return new InvalidLnPaymentTxnsBundleError()

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
    switch (true) {
      case txns.length === 1:
        return LnPaymentState.Success

      case txns.length === 2 && sumTxAmounts === 0:
        return LnPaymentState.Failed

      case txns.length % 2 === 1:
        return LnPaymentState.SuccessAfterRetry

      case txns.length % 2 === 0 && sumTxAmounts === 0:
        return LnPaymentState.FailedAfterRetry

      default:
        return new InvalidLnPaymentTxnsBundleError()
    }
  }

  return { determine }
}
