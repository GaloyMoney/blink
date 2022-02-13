import { PaymentNotFoundError, PaymentStatus } from "@domain/bitcoin/lightning"
import { CouldNotFindError } from "@domain/errors"
import { LedgerService } from "@services/ledger"
import { LndService } from "@services/lnd"
import { baseLogger } from "@services/logger"
import { LnPaymentsRepository } from "@services/mongoose"
import { asyncRunInSpan, SemanticAttributes } from "@services/tracing"

let lndService

export const migrateLnPaymentsFromLndByHash = async (): Promise<true> =>
  asyncRunInSpan(
    "debug.migrateLnPaymentsFromLndByHash",
    { [SemanticAttributes.CODE_FUNCTION]: "debug.migrateLnPaymentsFromLndByHash" },
    async (): Promise<true> => {
      lndService = LndService()
      if (lndService instanceof Error) return true

      const paymentHashes = await LedgerService().listAllPaymentHashes()
      for await (const paymentHash of paymentHashes) {
        const res = await asyncRunInSpan(
          "debug.migrateLnPayment",
          {
            [SemanticAttributes.CODE_FUNCTION]: "debug.migrateLnPayment",
          },
          async (): Promise<true | LightningServiceError> => {
            if (paymentHash instanceof Error) return paymentHash

            const migrated = await migrateLnPayment(paymentHash)
            if (migrated instanceof Error) return migrated

            return true
          },
        )

        if (res instanceof Error) break
      }
      return true
    },
  )

const migrateLnPayment = async (
  paymentHash: PaymentHash,
): Promise<true | LightningServiceError> => {
  // Check if hash exists in lnPayments repo
  const lnPaymentsRepo = LnPaymentsRepository()
  const lnPaymentExists = await lnPaymentsRepo.findByPaymentHash(paymentHash)
  if (!(lnPaymentExists instanceof CouldNotFindError)) return true

  // Fetch payment from lnd
  const payment = await lndService.lookupPayment({
    pubkey: lndService.defaultPubkey(),
    paymentHash,
  })
  if (payment instanceof PaymentNotFoundError) return true
  if (payment instanceof Error) return payment

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
      ? {
          ...partialLnPayment,
          status: PaymentStatus.Failed,
          confirmedDetails: undefined,
          attempts: undefined,
          isCompleteRecord: true,
        }
      : {
          ...partialLnPayment,
          createdAt: payment.createdAt,
          status: payment.status,
          milliSatsAmount: payment.milliSatsAmount,
          roundedUpAmount: payment.roundedUpAmount,
          confirmedDetails: payment.confirmedDetails,
          attempts: payment.attempts, // will be null, only comes from getPayments
          isCompleteRecord: true,
        }

  const updatedPaymentLookup = await LnPaymentsRepository().persistNew(newLnPayment)
  if (updatedPaymentLookup instanceof Error) {
    baseLogger.error(
      { error: updatedPaymentLookup },
      "Could not update LnPayments repository",
    )
  }

  return true
}
