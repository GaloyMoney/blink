import { LedgerTransactionType } from "@domain/ledger"
import { FeeReimbursement } from "@domain/ledger/fee-reimbursement"
import { PriceRatio } from "@domain/payments"
import { paymentAmountFromSats, WalletCurrency } from "@domain/shared"

import * as LedgerFacade from "@services/ledger/facade"

export const reimburseFee = async ({
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

  const priceRatio = PriceRatio(paymentFlow.paymentAmounts())
  if (priceRatio instanceof Error) return priceRatio

  const feeDifference = FeeReimbursement({
    prepaidFeeAmount: maxFeeAmounts,
    priceRatio,
  }).getReimbursement(actualFeeAmount)
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
    recipientWalletDescriptor: paymentFlow.senderWalletDescriptor(),
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
