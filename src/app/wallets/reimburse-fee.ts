import { getCurrentPrice } from "@app/prices"
import { FeeReimbursement } from "@domain/ledger/fee-reimbursement"
import { LedgerService } from "@services/ledger"

export const reimburseFee = async ({
  walletId,
  journalId,
  paymentHash,
  maxFee,
  actualFee,
  logger,
}: {
  walletId: WalletId
  journalId: LedgerJournalId
  paymentHash: PaymentHash
  maxFee: Satoshis
  actualFee: Satoshis
  logger: Logger
}): Promise<void | ApplicationError> => {
  const feeReimbursement = FeeReimbursement(maxFee)
  const feeDifference = feeReimbursement.getReimbursement({
    actualFee,
  })
  if (feeDifference instanceof Error) {
    logger.warn({ maxFee, actualFee }, `Invalid reimbursement fee`)
    return
  }

  if (feeDifference === 0) {
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

  const price = await getCurrentPrice()
  if (price instanceof Error) return price
  const usd = feeDifference * price

  const ledgerService = LedgerService()
  const result = await ledgerService.addLnFeeReimbursementReceive({
    walletId,
    paymentHash,
    sats: feeDifference,
    usd,
    journalId,
  })
  if (result instanceof Error) return result
}
