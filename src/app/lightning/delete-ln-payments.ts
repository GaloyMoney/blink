import { UnknownLightningServiceError } from "@domain/bitcoin/lightning"
import { LndService } from "@services/lnd"
import { baseLogger } from "@services/logger"
import { LnPaymentsRepository } from "@services/mongoose"
import {
  addAttributesToCurrentSpan,
  asyncRunInSpan,
  SemanticAttributes,
} from "@services/tracing"
import { elapsedSinceTimestamp } from "@utils"

export const deleteLnPaymentsBefore = async (
  timestamp: Date,
): Promise<true | ApplicationError> => {
  const paymentHashesBefore = await listAllPaymentsBefore(timestamp)

  const start = new Date(Date.now())
  baseLogger.info({ start }, "start of delete loop")
  for await (const paymentHash of paymentHashesBefore) {
    if (paymentHash instanceof Error) return paymentHash
    await checkAndDeletePaymentForHash(paymentHash)
  }
  const end = new Date(Date.now())
  baseLogger.info({ end, elapsed: elapsedSinceTimestamp(start) }, "end of delete loop")

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
      if (lnPayment instanceof Error) return lnPayment

      addAttributesToCurrentSpan({ isCompleteRecord: lnPayment.isCompleteRecord })
      if (!lnPayment.isCompleteRecord) return false

      const lndService = LndService()
      if (lndService instanceof Error) return lndService

      const deleted = lndService.deletePaymentByHash({ paymentHash, pubkey })
      if (deleted instanceof Error) return deleted
      addAttributesToCurrentSpan({ deleted: true })
      baseLogger.info({ paymentHash }, "successfully deleted")

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

  baseLogger.info(
    { pubkeys, listFns: listFns.map((fn) => fn.name) },
    "listAllPayments start of loop",
  )
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

        baseLogger.info(
          { length: result.lnPayments.length, timestamp, pubkey, listFn: listFn.name },
          "lnPayments start of loop",
        )
        let iteration = 0
        for (const payment of result.lnPayments) {
          baseLogger.info(
            {
              iteration,
              index: payment.index,
              paymentHash: payment.paymentHash,
              createdAt: payment.createdAt,
              yield: payment.createdAt < timestamp,
            },
            "payment in loop",
          )
          iteration++
          if (payment.createdAt < timestamp) {
            yield { paymentHash: payment.paymentHash, pubkey }
          }
        }
        baseLogger.info({ pubkey, listFn: listFn.name }, "lnPayments end of loop")
      }
    }
  }
}
