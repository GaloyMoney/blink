import { FeeReimbursement } from "@domain/ledger/fee-reimbursement"
import { LedgerService } from "@services/ledger"
import { PriceService } from "@services/price"

export const reimburseFee = async ({
  liabilitiesAccountId,
  journalId,
  paymentId,
  paymentHash,
  maxFee,
  actualFee,
  logger,
}: {
  liabilitiesAccountId: LiabilitiesAccountId
  journalId: LedgerJournalId
  paymentId: PaymentId
  paymentHash: PaymentHash
  maxFee: Satoshis
  actualFee: Satoshis
  logger: Logger
}): Promise<void | ApplicationError> => {
  const feeReimbursement = FeeReimbursement(maxFee)
  const feeDifference = feeReimbursement.getReimbursement({
    actualFee,
  })
  if (feeDifference === null) {
    logger.warn(
      {
        maxFee,
        actualFee,
      },
      `Invalid reimbursement fee`,
    )
    return
  }

  logger.info(
    {
      feeDifference,
      maxFee,
      actualFee,
      id: paymentHash,
    },
    "logging a fee difference",
  )

  const price = await PriceService().getCurrentPrice()
  if (price instanceof Error) return price
  const usd = feeDifference * price

  const ledgerService = LedgerService()
  const result = await ledgerService.addLnFeeReimbursementReceive({
    liabilitiesAccountId,
    paymentHash,
    sats: feeDifference,
    usd,
    journalId,
    paymentId,
  })
  if (result instanceof Error) return result
}
