import { getCurrentPrice } from "@app/prices"
import { toSats } from "@domain/bitcoin"
import { DisplayCurrencyConverter, toCents } from "@domain/fiat"
import { LedgerTransactionType } from "@domain/ledger"
import { FeeReimbursement } from "@domain/ledger/fee-reimbursement"
import { PriceRatio } from "@domain/payments"
import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"

import * as LedgerFacade from "@services/ledger/facade"
import { baseLogger } from "@services/logger"

export const reimburseFee = async <S extends WalletCurrency, R extends WalletCurrency>({
  senderAccount,
  paymentFlow,
  journalId,
  actualFee,
  revealedPreImage,
}: {
  senderAccount: Account
  paymentFlow: PaymentFlow<S, R>
  journalId: LedgerJournalId
  actualFee: Satoshis
  revealedPreImage?: RevealedPreImage
}): Promise<true | ApplicationError> => {
  const actualFeeAmount = paymentAmountFromNumber({
    amount: actualFee,
    currency: WalletCurrency.Btc,
  })
  if (actualFeeAmount instanceof Error) return actualFeeAmount

  const maxFeeAmounts = {
    btc: paymentFlow.btcProtocolAndBankFee,
    usd: paymentFlow.usdProtocolAndBankFee,
  }

  const priceRatio = PriceRatio(paymentFlow.paymentAmounts())
  if (priceRatio instanceof Error) return priceRatio

  const feeDifference = FeeReimbursement({
    prepaidFeeAmount: maxFeeAmounts,
    priceRatio,
  }).getReimbursement(actualFeeAmount)
  if (feeDifference instanceof Error) {
    baseLogger.warn(
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

  const converter = DisplayCurrencyConverter({
    currency: senderAccount.displayCurrency,
    getPriceFn: getCurrentPrice,
  })
  const reimburseAmountDisplayCurrency = await converter.fromBtcAmount(feeDifference.btc)
  if (reimburseAmountDisplayCurrency instanceof Error)
    return reimburseAmountDisplayCurrency

  const paymentHash = paymentFlow.paymentHashForFlow()
  if (paymentHash instanceof Error) return paymentHash

  const metadata: FeeReimbursementLedgerMetadata = {
    hash: paymentHash,
    type: LedgerTransactionType.LnFeeReimbursement,
    pending: false,
    related_journal: journalId,

    usd: (reimburseAmountDisplayCurrency / 100) as DisplayCurrencyBaseAmount,

    satsAmount: toSats(feeDifference.btc.amount),
    centsAmount: toCents(feeDifference.usd.amount),
    satsFee: toSats(0),
    centsFee: toCents(0),

    displayAmount: reimburseAmountDisplayCurrency,
    displayFee: 0 as DisplayCurrencyBaseAmount,
    displayCurrency: senderAccount.displayCurrency,
  }

  const txMetadata: LnLedgerTransactionMetadataUpdate = {
    hash: paymentHash,
    revealedPreImage,
  }

  baseLogger.info(
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
