import { getCurrentPrice } from "@app/prices"
import { DealerPriceServiceError } from "@domain/dealer-price"
import {
  DisplayCurrencyConverter,
  toDisplayCurrencyBaseAmount,
} from "@domain/fiat/display-currency"
import { LedgerTransactionType } from "@domain/ledger"
import { FeeReimbursement, NewFeeReimbursement } from "@domain/ledger/fee-reimbursement"
import { paymentAmountFromSats, WalletCurrency } from "@domain/shared"
import { DealerPriceService } from "@services/dealer-price"
import { LedgerService } from "@services/ledger"

import * as LedgerFacade from "@services/ledger/facade"

export const reimburseFee = async ({
  walletId,
  walletCurrency,
  journalId,
  paymentHash,
  maxFee,
  actualFee,
  revealedPreImage,
  logger,
}: {
  walletId: WalletId
  walletCurrency: WalletCurrency
  journalId: LedgerJournalId
  paymentHash: PaymentHash
  maxFee: Satoshis
  actualFee: Satoshis
  revealedPreImage?: RevealedPreImage
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
    revealedPreImage,
  })
  if (result instanceof Error) return result

  return true
}

export const newReimburseFee = async ({
  paymentFlow,
  journalId,
  actualFee,
  revealedPreImage,
  logger,
}: {
  paymentFlow: PaymentFlow<WalletCurrency, WalletCurrency>
  journalId: LedgerJournalId
  actualFee: Satoshis
  revealedPreImage?: RevealedPreImage
  logger: Logger
}): Promise<true | ApplicationError> => {
  const actualFeeAmount = paymentAmountFromSats(actualFee)

  const maxFeeAmounts = {
    btc: paymentFlow.btcProtocolFee,
    usd: paymentFlow.usdProtocolFee,
  }

  const feeDifference =
    NewFeeReimbursement(maxFeeAmounts).getReimbursement(actualFeeAmount)
  if (feeDifference instanceof Error) {
    logger.warn(
      { maxFee: maxFeeAmounts, actualFee: actualFeeAmount },
      `Invalid reimbursement fee`,
    )
    return true
  }

  // TODO: only reimburse fees is this is above a (configurable) threshold
  // ie: adding an entry for 1 sat fees may not be the best scalability wise for the db
  if (feeDifference.btc.amount === 0n) {
    return true
  }

  const amountDisplayCurrency = Number(
    feeDifference.usd.amount,
  ) as DisplayCurrencyBaseAmount

  const metadata: FeeReimbursementLedgerMetadata = {
    hash: paymentFlow.paymentHash,
    type: LedgerTransactionType.LnFeeReimbursement,
    pending: false,
    usd: amountDisplayCurrency,
    related_journal: journalId,
  }

  const txMetadata: LnLedgerTransactionMetadataUpdate = {
    hash: paymentFlow.paymentHash,
    revealedPreImage,
  }

  logger.info(
    {
      feeDifference,
      maxFee: maxFeeAmounts,
      actualFee,
      paymentHash: paymentFlow.paymentHash,
    },
    "logging a fee difference",
  )

  const result = await LedgerFacade.recordReceive({
    description: "fee reimbursement",
    receiverWalletDescriptor: paymentFlow.senderWalletDescriptor(),
    amountToCreditReceiver: {
      usd: feeDifference.usd,
      btc: feeDifference.btc,
    },
    metadata,
    txMetadata,
  })
  if (result instanceof Error) return result

  return true
}
