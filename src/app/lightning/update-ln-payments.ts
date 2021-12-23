import { LndService } from "@services/lnd"
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
  listPaymentsFn: (after) => Promise<ListLnPaymentsResult | LightningServiceError>
}) => {
  const processedLnPaymentsHashes: PaymentHash[] | ApplicationError = []
  const incompleteLnPaymentsHashes = incompleteLnPayments.map((p) => p.paymentHash)

  let lnPayments: LnPaymentLookup[]
  let endCursor: PagingToken | undefined = undefined
  do {
    const result: ListLnPaymentsResult | LightningError = await listPaymentsFn(endCursor)
    if (result instanceof Error) return result
    ;({ lnPayments, endCursor } = result)

    for (const payment of lnPayments) {
      if (incompleteLnPaymentsHashes.includes(payment.paymentHash)) {
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
        if (updatedPaymentLookup instanceof Error) return updatedPaymentLookup
        processedLnPaymentsHashes.push(payment.paymentHash)
      }
    }
  } while (
    processedLnPaymentsHashes.length < incompleteLnPaymentsHashes.length &&
    endCursor
  )

  return incompleteLnPayments.filter(
    (p) => !processedLnPaymentsHashes.includes(p.paymentHash),
  )
}
