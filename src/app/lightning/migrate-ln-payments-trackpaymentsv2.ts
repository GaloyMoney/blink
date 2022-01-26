import { PaymentNotFoundError, PaymentStatus } from "@domain/bitcoin/lightning"
import { CouldNotFindError } from "@domain/errors"
import { LedgerService } from "@services/ledger"
import { LndService } from "@services/lnd"
import { baseLogger } from "@services/logger"
import { LnPaymentsRepository } from "@services/mongoose"

export const migrateLnPaymentsFromLnd = async (): Promise<true | ApplicationError> => {
  const ledgerService = LedgerService()
  const result = await ledgerService.createListPaymentHashesGenerator()
  if (result instanceof Error) return result

  let paymentHash: true | PaymentHash | undefined | LedgerServiceError = true
  while (paymentHash) {
    // Fetch next payment to increment the loop
    paymentHash = await ledgerService.nextPayment(result)
    if (paymentHash instanceof Error) return paymentHash
    if (paymentHash === undefined) break

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
