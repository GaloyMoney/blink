import { UnknownLightningServiceError } from "@domain/bitcoin/lightning"
import { CouldNotFindLnPaymentFromHashError } from "@domain/errors"
import { LndService } from "@services/lnd"
import { LnPaymentsRepository } from "@services/mongoose"
import {
  addAttributesToCurrentSpan,
  asyncRunInSpan,
  SemanticAttributes,
} from "@services/tracing"

export const deleteLnPaymentsBefore = async (
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
}): Promise<boolean | ApplicationError> =>
  asyncRunInSpan(
    "app.lightning.checkAndDeletePaymentForHash",
    {
      attributes: {
        [SemanticAttributes.CODE_FUNCTION]: "checkAndDeletePaymentForHash",
        [SemanticAttributes.CODE_NAMESPACE]: "lightning",
        paymentHash,
        pubkey,
        deleted: false,
      },
    },
    async () => {
      const lnPayment = await LnPaymentsRepository().findByPaymentHash(paymentHash)
      if (lnPayment instanceof Error) {
        if (lnPayment instanceof CouldNotFindLnPaymentFromHashError) {
          // Attempt to get paymentRequest from lnd
          const lndService = LndService()
          if (lndService instanceof Error) return lndService
          const lnPaymentLookup = await lndService.lookupPayment({ pubkey, paymentHash })
          if (lnPaymentLookup instanceof Error) return lnPaymentLookup
          const { paymentRequest } =
            "createdAt" in lnPaymentLookup
              ? lnPaymentLookup
              : { paymentRequest: undefined }

          await LnPaymentsRepository().persistNew({
            paymentHash,
            paymentRequest,
            sentFromPubkey: pubkey,
          })

          addAttributesToCurrentSpan({ existedInRepository: false })
          return false
        }
        addAttributesToCurrentSpan({ ["existedInRepository.undefined"]: true })
        return lnPayment
      }

      addAttributesToCurrentSpan({
        existedInRepository: true,
        isCompleteRecord: lnPayment.isCompleteRecord,
      })
      if (!lnPayment.isCompleteRecord) return false

      const lndService = LndService()
      if (lndService instanceof Error) return lndService

      const deleted = lndService.deletePaymentByHash({ paymentHash, pubkey })
      if (deleted instanceof Error) return deleted
      addAttributesToCurrentSpan({ deleted: true })

      return true
    },
  )

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
