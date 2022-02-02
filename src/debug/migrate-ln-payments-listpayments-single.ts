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
import { getPayments } from "lightning"

const indexRegex = /{"offset":(\d+),"limit":\d+}/

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
  let count = await getFirstIndex(pubkey)
  if (count instanceof Error) return true

  while (count !== 0) {
    // Get next payment and unpack
    const results: ListLnPaymentsResult | LightningServiceError = await listFn({
      pubkey,
      after: `{"offset":${count},"limit":1}` as PagingContinueToken,
    })
    if (results instanceof CorruptLndDbError) {
      count--
      continue
    }
    if (results instanceof Error) {
      baseLogger.error(
        { error: results },
        `Could not fetch payments for pubkey ${pubkey}`,
      )
      break
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
          break
        }
        count = index === count ? index - 1 : index
      }
    }

    if (payment === undefined) continue

    // Fetch lnPayment from collection
    const lnPaymentsRepo = LnPaymentsRepository()
    const persistedPaymentLookup = await lnPaymentsRepo.findByPaymentHash(
      payment.paymentHash,
    )
    if (
      persistedPaymentLookup instanceof Error &&
      !(persistedPaymentLookup instanceof CouldNotFindError)
    )
      continue

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
        baseLogger.error(
          { error: updatedPaymentLookup },
          "Could not update LnPayments repository",
        )
      }
      continue
    }

    // LnPayment: already persisted
    if (persistedPaymentLookup.isCompleteRecord) continue

    // LnPayment: exists but payment is still pending
    if (payment.status === PaymentStatus.Pending) continue

    // LnPayment: update completed payment
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
    }
  }

  return true
}

const getFirstIndex = async (pubkey: Pubkey): Promise<number | ApplicationError> => {
  const { lnd } = getLndFromPubkey({ pubkey })
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
