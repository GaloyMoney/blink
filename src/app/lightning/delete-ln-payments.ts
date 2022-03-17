import { TWO_WEEKS_IN_MS } from "@config"
import { UnknownLightningServiceError } from "@domain/bitcoin/lightning"
import { LndService } from "@services/lnd"
import { LnPaymentsRepository } from "@services/mongoose"

export const deleteLnPaymentsBefore2Weeks = async () => {
  const timestamp2Weeks = new Date(Date.now() - TWO_WEEKS_IN_MS)
  return deleteLnPaymentsBefore(timestamp2Weeks)
}

const deleteLnPaymentsBefore = async (
  timestamp: Date,
): Promise<true | ApplicationError> => {
  const paymentHashesBefore = await listAllPaymentsBefore(timestamp)

  for await (const paymentHash of paymentHashesBefore) {
    if (paymentHash instanceof Error) return paymentHash
    await checkAndDeletePaymentForHash(paymentHash)
  }

  return true
}

const checkAndDeletePaymentForHash = async ({
  paymentHash,
  pubkey,
}: {
  paymentHash: PaymentHash
  pubkey: Pubkey
}): Promise<boolean | ApplicationError> => {
  const lnPayment = await LnPaymentsRepository().findByPaymentHash(paymentHash)
  if (lnPayment instanceof Error) return lnPayment

  if (!lnPayment.isCompleteRecord) return false

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const deleted = lndService.deletePaymentByHash({ paymentHash, pubkey })
  if (deleted instanceof Error) return deleted

  return true
}

const listAllPaymentsBefore = async function* (
  timestamp: Date,
): AsyncGenerator<{ paymentHash: PaymentHash; pubkey: Pubkey } | LightningServiceError> {
  const lndService = LndService()
  if (lndService instanceof Error) {
    yield lndService
    return
  }
  const pubkeys: Pubkey[] = lndService.listActivePubkeys()
  const listFns: ListLnPayments[] = [
    lndService.listSettledPayments,
    lndService.listFailedPayments,
  ]

  for (const pubkey of pubkeys) {
    for (const listFn of listFns) {
      let after: PagingStartToken | PagingContinueToken | PagingStopToken = undefined
      while (after !== false) {
        const result: ListLnPaymentsResult | LightningServiceError = await listFn({
          after,
          pubkey,
        })
        if (result instanceof Error) {
          yield result
          return
        }

        if (after === result.endCursor) {
          yield new UnknownLightningServiceError()
          return
        }
        after = result.endCursor

        for (const payment of result.lnPayments) {
          if (payment.createdAt < timestamp) {
            yield { paymentHash: payment.paymentHash, pubkey }
          }
        }
      }
    }
  }
}
