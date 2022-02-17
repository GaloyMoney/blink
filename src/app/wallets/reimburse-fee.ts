import { getCurrentPrice } from "@app/prices"
import { DealerPriceServiceError } from "@domain/dealer-price"
import {
  DisplayCurrencyConverter,
  toDisplayCurrencyBaseAmount,
} from "@domain/fiat/display-currency"
import { FeeReimbursement } from "@domain/ledger/fee-reimbursement"
import { WalletCurrency } from "@domain/wallets"
import { DealerPriceService } from "@services/dealer-price"
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
}): Promise<true | ApplicationError> => {
  let cents: UsdCents | undefined

  const feeDifference = FeeReimbursement(maxFee).getReimbursement(actualFee)

  if (feeDifference instanceof Error) {
    logger.warn({ maxFee, actualFee }, `Invalid reimbursement fee`)
    return true
  }

  // TODO: only reimburse fees is this is above a (configurable) threshold
  // ie: adding an entry for 1 sat fees may not be the best scalability wise for the db
  if (feeDifference === 0) {
    return true
  }

  const price = await getCurrentPrice()
  let amountDisplayCurrency: DisplayCurrencyBaseAmount
  if (price instanceof Error) {
    amountDisplayCurrency = toDisplayCurrencyBaseAmount(0)
  } else {
    amountDisplayCurrency = DisplayCurrencyConverter(price).fromSats(feeDifference)
  }

  if (walletCurrency === WalletCurrency.Usd) {
    const dealerPrice = DealerPriceService()
    const cents_ = await dealerPrice.getCentsFromSatsForImmediateBuy(feeDifference)
    if (cents_ instanceof DealerPriceServiceError) return cents_
    cents = cents_
  }

  logger.info(
    { feeDifference, maxFee, actualFee, paymentHash, cents },
    "logging a fee difference",
  )

  const ledgerService = LedgerService()
  const result = await ledgerService.addLnFeeReimbursementReceive({
    walletId,
    walletCurrency,
    paymentHash,
    sats: feeDifference,
    amountDisplayCurrency,
    journalId,
    cents,
  })
  if (result instanceof Error) return result

  return true
}
