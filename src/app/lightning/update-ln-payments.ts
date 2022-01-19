import { LndService } from "@services/lnd"
import { baseLogger } from "@services/logger"
import { LnPaymentsRepository } from "@services/mongoose/ln-payments"

export const updateLnPayments = async (): Promise<true | ApplicationError> => {
  const processedLnPaymentsHashes: PaymentHash[] | ApplicationError = []

  const incompleteLnPayments = await LnPaymentsRepository().listIncomplete()
  if (incompleteLnPayments instanceof Error) return incompleteLnPayments

  const pubkeysFromPayments = new Set(incompleteLnPayments.map((p) => p.sentFromPubkey))

  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  const pubkeys = lndService
    .listActivePubkeys()
    .filter((pubkey) => pubkeysFromPayments.has(pubkey))

  for (const key of pubkeys) {
    const pubkey = key as Pubkey

    let after: PagingStartToken | PagingContinueToken = undefined
    while (processedLnPaymentsHashes.length < incompleteLnPayments.length) {
      // Fetch from Lightning service
      const results: ListLnPaymentsResult | LightningServiceError =
        await lndService.listSettledAndFailedPayments({
          pubkey,
          after,
        })
      if (results instanceof Error) {
        baseLogger.error(
          { error: results },
          `Could not fetch payments for pubkey ${pubkey}`,
        )
        continue
      }

      // Update LnPayments repository
      for (const payment of results.lnPayments) {
        const persistedPaymentLookup = incompleteLnPayments.find(
          (elem) => elem.paymentHash === payment.paymentHash,
        )
        if (!persistedPaymentLookup) continue

        persistedPaymentLookup.createdAt = payment.createdAt
        persistedPaymentLookup.status = payment.status
        persistedPaymentLookup.milliSatsAmount = payment.milliSatsAmount
        persistedPaymentLookup.roundedUpAmount = payment.roundedUpAmount
        persistedPaymentLookup.confirmedDetails = payment.confirmedDetails
        persistedPaymentLookup.attempts = payment.attempts

        persistedPaymentLookup.isCompleteRecord = true

        const updatedPaymentLookup = await LnPaymentsRepository().update(
          persistedPaymentLookup,
        )
        if (updatedPaymentLookup instanceof Error) {
          baseLogger.error(
            { error: updatedPaymentLookup },
            "Could not update LnPayments repository",
          )
          continue
        }
        processedLnPaymentsHashes.push(payment.paymentHash)

        if (results.endCursor === false) break
        after = results.endCursor
      }
    }
  }
  return true
}
