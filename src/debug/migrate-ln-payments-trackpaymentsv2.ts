import { PaymentNotFoundError, PaymentStatus } from "@domain/bitcoin/lightning"
import { CouldNotFindError } from "@domain/errors"
import { LedgerService } from "@services/ledger"
import { LndService } from "@services/lnd"
import { baseLogger } from "@services/logger"
import { LnPaymentsRepository } from "@services/mongoose"

export const migrateLnPaymentsFromLnd = async (): Promise<true | ApplicationError> => {
  const paymentHashes = await LedgerService().listPaymentHashes()
  for await (const paymentHash of paymentHashes) {
    if (paymentHash instanceof Error) return paymentHash

    // Check if hash exists in lnPayments repo
    const lnPaymentsRepo = LnPaymentsRepository()
    const lnPaymentExists = await lnPaymentsRepo.findByPaymentHash(paymentHash)
    if (!(lnPaymentExists instanceof CouldNotFindError)) continue

    // Fetch payment from lnd
    const lndService = LndService()
    if (lndService instanceof Error) return lndService
    const payment = await lndService.lookupPayment({
      pubkey: lndService.defaultPubkey(),
      paymentHash,
    })
    if (payment instanceof PaymentNotFoundError) continue
    if (payment instanceof Error) break

    // Add payment to LnPayments collection
    const partialLnPayment = {
      paymentHash,
      paymentRequest: undefined,
      sentFromPubkey: lndService.defaultPubkey(),
      createdAt: undefined,
    }
    const newLnPayment =
      payment.status === PaymentStatus.Pending
        ? partialLnPayment
        : payment.status === PaymentStatus.Failed
        ? { ...partialLnPayment, status: PaymentStatus.Failed }
        : {
            ...partialLnPayment,
            createdAt: payment.createdAt,
            status: payment.status,
            milliSatsAmount: payment.milliSatsAmount,
            roundedUpAmount: payment.roundedUpAmount,
            confirmedDetails: payment.confirmedDetails,
            attempts: payment.attempts, // will be null, only comes from getPayments
          }

    const updatedPaymentLookup = await LnPaymentsRepository().persistNew(newLnPayment)
    if (updatedPaymentLookup instanceof Error) {
      baseLogger.error(
        { error: updatedPaymentLookup },
        "Could not update LnPayments repository",
      )
    }
  }
  return true
}
