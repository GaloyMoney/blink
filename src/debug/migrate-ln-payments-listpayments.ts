/**
 * how to run:
 *	. ./.envrc && yarn ts-node \
 *		--files \
 *			-r tsconfig-paths/register \
 *			-r src/services/tracing.ts \
 *		src/debug/migrate-ln-payments-listpayments.ts
 */

import { getPayments } from "lightning"
import { isUp } from "@services/lnd/health"
import { params as unauthParams } from "@services/lnd/unauth"

import {
  CorruptLndDbError,
  PaymentStatus,
  UnknownLightningServiceError,
} from "@domain/bitcoin/lightning"
import { CouldNotFindError } from "@domain/errors"
import { LndService } from "@services/lnd"
import { getLndFromPubkey } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { LnPaymentsRepository } from "@services/mongoose"
import {
  addAttributesToCurrentSpan,
  addEventToCurrentSpan,
  asyncRunInSpan,
  SemanticAttributes,
} from "@services/tracing"
import { setupMongoConnection } from "@services/mongodb"

const indexRegex = /{"offset":(\d+),"limit":\d+}/

const main = async () =>
  asyncRunInSpan(
    "debug.migrateLnPaymentsFromLnd",
    {
      attributes: {
        [SemanticAttributes.CODE_FUNCTION]: "debug.migrateLnPaymentsFromLnd",
      },
    },
    async (): Promise<true | ApplicationError> => {
      const lndService = LndService()
      if (lndService instanceof Error) return lndService

      const listFns = [lndService.listSettledPayments, lndService.listFailedPayments]
      const pubkeys = lndService.listActivePubkeys()

      for (const listFn of listFns) {
        for (const pubkey of pubkeys) {
          let count = await getFirstIndex(pubkey)
          if (count instanceof Error) continue

          while (count !== 0) {
            count = await asyncRunInSpan(
              "debug.migrateLnPaymentsByFunction",
              {
                attributes: {
                  [SemanticAttributes.CODE_FUNCTION]: "debug.migrateLnPaymentsByFunction",
                  "migrateLnPaymentsByFunction.iteration": `${listFn.name}:${count}`,
                  "migrateLnPaymentsByFunction.pubkey": pubkey,
                },
              },
              async () => {
                if (count instanceof Error) return count
                const updatedCount = await migrateLnPaymentsByFunction({
                  offset: count,
                  pubkey,
                  listFn,
                })
                addAttributesToCurrentSpan({
                  "migrateLnPaymentsByFunction.nextoffset":
                    updatedCount instanceof Error
                      ? updatedCount.name
                      : updatedCount.toString(),
                })
                return updatedCount
              },
            )
            if (count instanceof Error) break
          }
        }
      }
      return true
    },
  )

const migrateLnPaymentsByFunction = async ({
  offset,
  pubkey,
  listFn,
}: {
  offset: number
  pubkey: Pubkey
  listFn: (
    args: ListLnPaymentsArgs,
  ) => Promise<ListLnPaymentsResult | LightningServiceError>
}): Promise<number | Error> => {
  let count = offset
  // Get next payment and unpack
  const results: ListLnPaymentsResult | LightningServiceError = await listFn({
    pubkey,
    after: `{"offset":${offset},"limit":1}` as PagingContinueToken,
  })
  if (results instanceof CorruptLndDbError) {
    const errMsg = `${results.name} at offset ${offset}`
    baseLogger.error(errMsg)
    addEventToCurrentSpan(errMsg)
    count--
    return count
  }
  if (results instanceof Error) {
    const errMsg = `Could not fetch payments for pubkey ${pubkey}`
    baseLogger.error({ error: results }, errMsg)
    addEventToCurrentSpan(errMsg)
    return results
  }
  const {
    lnPayments: [payment],
    endCursor,
  } = results

  // Set next cursor or exit
  if (endCursor === false) {
    count = 0
  } else {
    const indexMatch = endCursor.match(indexRegex)?.[1]
    if (!indexMatch) {
      count = 0
    } else {
      const index = parseInt(indexMatch)
      if (isNaN(index)) {
        baseLogger.error(`Invalid continue token: ${endCursor}`)
        return new UnknownLightningServiceError()
      }
      count = index === count ? index - 1 : index
    }
  }

  if (payment === undefined) {
    const errMsg = `Skipping, 'payments' array empty for offset ${offset}`
    baseLogger.error(errMsg)
    addEventToCurrentSpan(errMsg)
    return count
  }
  addAttributesToCurrentSpan({
    "migrateLnPaymentsByFunction.paymentHash": payment.paymentHash,
  })

  // Fetch lnPayment from collection
  const lnPaymentsRepo = LnPaymentsRepository()
  const persistedPaymentLookup = await lnPaymentsRepo.findByPaymentHash(
    payment.paymentHash,
  )
  if (
    persistedPaymentLookup instanceof Error &&
    !(persistedPaymentLookup instanceof CouldNotFindError)
  ) {
    const errMsg = `Skipping fetched payment at offset ${offset} for payment hash ${payment.paymentHash}`
    baseLogger.error({ error: persistedPaymentLookup }, errMsg)
    addEventToCurrentSpan(errMsg)
    return count
  }

  // LnPayment: persist new
  if (persistedPaymentLookup instanceof CouldNotFindError) {
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
      const errMsg = `Could not persist new LnPayment at offset ${offset} for payment hash ${payment.paymentHash}`
      baseLogger.error({ error: updatedPaymentLookup }, errMsg)
      addEventToCurrentSpan(errMsg)
    }
    baseLogger.info(
      `Success! Persisted new at offset ${offset} for payment hash ${payment.paymentHash}`,
    )
    addAttributesToCurrentSpan({
      "migrateLnPaymentsByFunction.success": `persistedNew:${offset}:${payment.paymentHash}`,
    })
    return count
  }

  // LnPayment: already persisted
  if (persistedPaymentLookup.isCompleteRecord) {
    const infoMsg = `Skipping, record already exists at offset ${offset} for payment hash ${payment.paymentHash}`
    baseLogger.info(infoMsg)
    addEventToCurrentSpan(infoMsg)
    return count
  }

  // LnPayment: exists but payment is still pending
  if (payment.status === PaymentStatus.Pending) {
    const infoMsg = `Skipping, payment still pending at offset ${offset} for payment hash ${payment.paymentHash}`
    baseLogger.info(infoMsg)
    addEventToCurrentSpan(infoMsg)
    return count
  }

  // LnPayment: update completed payment
  persistedPaymentLookup.createdAt = payment.createdAt
  persistedPaymentLookup.status = payment.status
  persistedPaymentLookup.milliSatsAmount = payment.milliSatsAmount
  persistedPaymentLookup.roundedUpAmount = payment.roundedUpAmount
  persistedPaymentLookup.confirmedDetails = payment.confirmedDetails
  persistedPaymentLookup.attempts = payment.attempts

  persistedPaymentLookup.isCompleteRecord = true

  const updatedPaymentLookup = await LnPaymentsRepository().update(persistedPaymentLookup)
  if (updatedPaymentLookup instanceof Error) {
    const errMsg = `Could not update LnPayments repository at offset ${offset} for payment hash ${payment.paymentHash}`
    baseLogger.error({ error: updatedPaymentLookup }, errMsg)
    addEventToCurrentSpan(errMsg)
  }
  const infoMsg = `Success! Updated existing at offset ${offset} for payment hash ${payment.paymentHash}`
  baseLogger.info(infoMsg)
  addAttributesToCurrentSpan({
    "migrateLnPaymentsByFunction.success": `updated:${offset}:${payment.paymentHash}`,
  })
  return count
}

const getFirstIndex = async (pubkey: Pubkey): Promise<number | ApplicationError> => {
  const lnd = getLndFromPubkey({ pubkey })
  if (lnd instanceof Error) return lnd

  let paymentsResults: GetPaymentsResults
  try {
    paymentsResults = await getPayments({ lnd, limit: 1 })
  } catch (err) {
    return new UnknownLightningServiceError(err)
  }

  const { next } = paymentsResults
  if (next === undefined) return new UnknownLightningServiceError()

  const indexMatch = next.match(indexRegex)?.[1]
  return indexMatch === undefined
    ? new UnknownLightningServiceError()
    : parseInt(indexMatch) + 1
}

setupMongoConnection(false)
  .then(async (mongoose) => {
    await Promise.all(unauthParams.map((lndParams) => isUp(lndParams)))
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
