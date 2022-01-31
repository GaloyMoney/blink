import { getCurrentPrice } from "@app/prices"
import {
  DisplayCurrencyConversionRate,
  toDisplayCurrencyBaseAmount,
} from "@domain/fiat/display-currency"
import { FeeReimbursement } from "@domain/ledger/fee-reimbursement"
import { LedgerService } from "@services/ledger"

export const reimburseFee = async ({
  walletId,
  walletCurrency,
  journalId,
  paymentHash,
  maxFee,
  actualFee,
  logger,
}: {
  walletId: WalletId
  walletCurrency: WalletCurrency
  journalId: LedgerJournalId
  paymentHash: PaymentHash
  maxFee: Satoshis
  actualFee: Satoshis
  logger: Logger
}): Promise<void | ApplicationError> => {
  const feeDifference = FeeReimbursement(maxFee).getReimbursement(actualFee)

  if (feeDifference instanceof Error) {
    logger.warn({ maxFee, actualFee }, `Invalid reimbursement fee`)
    return
  }

  if (feeDifference === 0) {
    return
  }

  logger.info(
    { feeDifference, maxFee, actualFee, paymentHash },
    "logging a fee difference",
  )

  const price = await getCurrentPrice()
  let amountDisplayCurrency: DisplayCurrencyBaseAmount
  if (price instanceof Error) {
    amountDisplayCurrency = toDisplayCurrencyBaseAmount(0)
  } else {
    amountDisplayCurrency = DisplayCurrencyConversionRate(price)(feeDifference)
  }

  const ledgerService = LedgerService()
  const result = await ledgerService.addLnFeeReimbursementReceive({
    walletId,
    walletCurrency,
    paymentHash,
    sats: feeDifference,
    amountDisplayCurrency,
    journalId,
  })
  if (result instanceof Error) return result
}
