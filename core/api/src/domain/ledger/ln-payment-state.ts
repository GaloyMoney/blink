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

const count = <T>({ arr, valueToCount }: { arr: T[]; valueToCount: T }): number =>
  arr.reduce((count, currentValue) => {
    return currentValue === valueToCount ? count + 1 : count
  }, 0)

const sum = <T>({ arr, propertyName }: { arr: T[]; propertyName: keyof T }): number =>
  arr.reduce((sum, currentItem) => {
    return sum + Number(currentItem[propertyName] || 0)
  }, 0)

const isDebit = (txn: LedgerTransaction<WalletCurrency>) => (txn.debit || 0) > 0

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
  unsortedTxns: LedgerTransaction<WalletCurrency>[],
): LnPaymentStateDeterminator => {
  const determine = (): LnPaymentState | InvalidLnPaymentTxnsBundleError => {
    const check = checkTxns(unsortedTxns)
    if (check instanceof Error) return check

    const txns = unsortedTxns.sort(
      (txA, txB) => txB.timestamp.getTime() - txA.timestamp.getTime(),
    )

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
      const reimburseTxn = txns.find(
        (tx) => tx.type === LedgerTransactionType.LnFeeReimbursement,
      )
      if (reimburseTxn === undefined) {
        return new InvalidLnPaymentTxnsBundleError("Impossible state")
      }

      const txnsAfterReimburse = txns.filter(
        (tx) => tx.timestamp > reimburseTxn.timestamp,
      )
      switch (true) {
        case txPaymentCount === 1:
          return LnPaymentState.SuccessWithReimbursement
        case !!txnsAfterReimburse.length:
          return LnPaymentState.FailedAfterSuccessWithReimbursement
        default:
          return LnPaymentState.SuccessWithReimbursementAfterRetry
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
        if (isDebit(txns[0])) {
          return LnPaymentState.SuccessAfterRetry
        }
        return LnPaymentState.FailedAfterSuccess

      case txns.length % 2 === 0 && (sumTxAmounts === 0 || failedUsdPayment):
        return LnPaymentState.FailedAfterRetry

      default:
        return new InvalidLnPaymentTxnsBundleError()
    }
  }

  return { determine }
}
