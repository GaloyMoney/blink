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
    await updateLnPaymentsByFunction({
      processedLnPaymentsHashes,
      incompleteLnPayments,
      pubkey,
      listFn: lndService.listSettledAndFailedPayments,
    })
  }
  return true
}

const updateLnPaymentsByFunction = async ({
  processedLnPaymentsHashes,
  incompleteLnPayments,
  pubkey,
  listFn,
}) => {
  let after: PagingStartToken | PagingContinueToken | PagingStopToken = undefined
  while (
    processedLnPaymentsHashes.length < incompleteLnPayments.length &&
    after !== false
  ) {
    // Fetch from Lightning service
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
    if (after === results.endCursor) break
    after = results.endCursor

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
    }
  }

  return processedLnPaymentsHashes
}
