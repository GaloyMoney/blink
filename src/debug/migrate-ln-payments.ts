import { PaymentStatus } from "@domain/bitcoin/lightning"
import { LndService } from "@services/lnd"
import { baseLogger } from "@services/logger"
import { LnPaymentsRepository } from "@services/mongoose"

export const migrateLnPaymentsFromLnd = async (): Promise<true | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const listFns = [
    lndService.listSettledAndPendingPayments,
    lndService.listFailedPayments,
  ]
  const pubkeys = lndService.listActivePubkeys()

  await listFns.map((listFn) =>
    pubkeys.map(async (pubkey) => migrateLnPaymentsByFunction({ pubkey, listFn })),
  )
  return true
}

const migrateLnPaymentsByFunction = async ({ pubkey, listFn }): Promise<true> => {
  let after: PagingStartToken | PagingContinueToken | PagingStopToken = undefined
  while (after !== false) {
    const results: ListLnPaymentsResult | LightningServiceError = await listFn({
      pubkey,
      after,
    })
    if (results instanceof Error) {
      baseLogger.error(
        { error: results },
        `Could not fetch payments for pubkey ${pubkey}`,
      )
      break
    }
    if (after == results.endCursor) break
    after = results.endCursor

    const hashes = results.lnPayments.map((p) => p.paymentHash)

    // Fetch all hashes from lnPayments repo
    const lnPaymentsRepo = LnPaymentsRepository()
    const lnPaymentsPersisted = await lnPaymentsRepo.listByPaymentHashes(hashes)
    if (lnPaymentsPersisted instanceof Error) continue

    // Persist if lndPayment doesn't exist
    for (const payment of results.lnPayments) {
      const persistedPaymentLookup = lnPaymentsPersisted.find(
        (elem) => elem.paymentHash === payment.paymentHash,
      )
      if (persistedPaymentLookup) continue

      const partialLnPayment = {
        paymentHash: payment.paymentHash,
        paymentRequest: payment.paymentRequest,
        sentFromPubkey: pubkey,
      }
      const newLnPayment =
        payment.status === PaymentStatus.Pending
          ? partialLnPayment
          : {
              ...partialLnPayment,
              createdAt: payment.createdAt,
              status: payment.status,
              milliSatsAmount: payment.milliSatsAmount,
              roundedUpAmount: payment.roundedUpAmount,
              confirmedDetails: payment.confirmedDetails,
              attempts: payment.attempts,
              isCompleteRecord: true,
            }

      const updatedPaymentLookup = await LnPaymentsRepository().persistNew(newLnPayment)
      if (updatedPaymentLookup instanceof Error) {
        baseLogger.error(
          { error: updatedPaymentLookup },
          "Could not update LnPayments repository",
        )
        continue
      }
    }
  }

  return true
}
