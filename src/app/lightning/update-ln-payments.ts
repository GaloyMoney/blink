import { LndService } from "@services/lnd"
import { baseLogger } from "@services/logger"
import { LnPaymentsRepository } from "@services/mongoose/ln-payments"

export const updateLnPayments = async (): Promise<true | ApplicationError> => {
  let incompleteLnPayments = await LnPaymentsRepository().listIncomplete()
  if (incompleteLnPayments instanceof Error) return incompleteLnPayments

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const lndListMethods = [lndService.listSettledPayments, lndService.listFailedPayments]
  for (const listPaymentsFn of lndListMethods) {
    incompleteLnPayments = await fetchAndUpdatePayments({
      incompleteLnPayments,
      listPaymentsFn,
    })
    if (incompleteLnPayments instanceof Error) return incompleteLnPayments
    if (incompleteLnPayments.length == 0) return true
  }

  return true
}

const fetchAndUpdatePayments = async ({
  incompleteLnPayments,
  listPaymentsFn,
}: {
  incompleteLnPayments: PersistedLnPaymentLookup[]
  listPaymentsFn: ({
    after,
    pubkey,
  }: ListLnPaymentsArgs) => Promise<ListLnPaymentsResult | LightningServiceError>
}) => {
  const processedLnPaymentsHashes: PaymentHash[] | ApplicationError = []

  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  const pubkeys = lndService.listPubkeys()

  let lnPayments: LnPaymentLookup[]
  const lastSeenCursorByPubkey: { [key: Pubkey]: PagingToken | false | undefined } = {}
  for (const key of pubkeys) lastSeenCursorByPubkey[key] = undefined

  // Breadth-first paginated fetch of payments across multiple lightning instances
  while (processedLnPaymentsHashes.length < incompleteLnPayments.length) {
    const endCursorValues = new Set(Object.values(lastSeenCursorByPubkey))
    if (endCursorValues.has(false) && endCursorValues.size === 1) break

    for (const key in lastSeenCursorByPubkey) {
      const pubkey = key as Pubkey
      const endCursor = lastSeenCursorByPubkey[pubkey]
      if (endCursor === false) continue

      // Paginated fetch from single lightning instance
      const result: ListLnPaymentsResult | LightningError = await listPaymentsFn({
        after: endCursor,
        pubkey,
      })
      if (result instanceof Error) return result
      ;({ lnPayments, endCursor: lastSeenCursorByPubkey[pubkey] } = result)

      // Update of LnPayments repository
      for (const payment of lnPayments) {
        let persistedPaymentLookup = incompleteLnPayments.find(
          (elem) => elem.paymentHash === payment.paymentHash,
        )
        if (!persistedPaymentLookup) continue

        persistedPaymentLookup = Object.assign(persistedPaymentLookup, {
          ...payment,
          paymentRequest: payment.paymentRequest || persistedPaymentLookup.paymentRequest,
          isCompleteRecord: true,
        })
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
  }

  return incompleteLnPayments.filter(
    (p) => !processedLnPaymentsHashes.includes(p.paymentHash),
  )
}
