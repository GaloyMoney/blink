import { toMilliSatsFromString, toSats } from "@domain/bitcoin"
import {
  CouldNotFindLnPaymentFromHashError,
  UnknownRepositoryError,
} from "@domain/errors"
import { LnPayment } from "@services/lnd/schema"

export const LnPaymentsRepository = (): ILnPaymentsRepository => {
  const findByPaymentHash = async (
    paymentHash: PaymentHash,
  ): Promise<PersistedLnPaymentLookup | RepositoryError> => {
    try {
      const result = await LnPayment.findOne({ paymentHash })
      if (!result) {
        return new CouldNotFindLnPaymentFromHashError(paymentHash)
      }
      return lnPaymentFromRaw(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const listByPaymentHashes = async (
    paymentHashes: PaymentHash[],
  ): Promise<PersistedLnPaymentLookup[] | RepositoryError> => {
    try {
      const results: LnPaymentType[] = await LnPayment.find({
        paymentHash: { $in: paymentHashes },
      })
      return results.map(lnPaymentFromRaw)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const listIncomplete = async (): Promise<
    PersistedLnPaymentLookup[] | RepositoryError
  > => {
    try {
      const result = await LnPayment.find({
        isCompleteRecord: false,
      })
      return result.map(lnPaymentFromRaw)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const persistNew = async (
    payment: LnPaymentPartial | PersistedLnPaymentLookup,
  ): Promise<LnPaymentPartial | PersistedLnPaymentLookup | RepositoryError> => {
    try {
      const result: LnPaymentType = await LnPayment.findOneAndUpdate(
        { paymentHash: payment.paymentHash },
        payment,
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      return result.isCompleteRecord
        ? lnPaymentFromRaw(result)
        : lnPaymentPartialFromRaw(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const update = async (
    payment: PersistedLnPaymentLookup,
  ): Promise<PersistedLnPaymentLookup | RepositoryError> => {
    try {
      const result = await LnPayment.findOneAndUpdate(
        { paymentHash: payment.paymentHash },
        payment,
        { new: true },
      )
      if (!result) return new CouldNotFindLnPaymentFromHashError()
      return lnPaymentFromRaw(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    findByPaymentHash,
    listByPaymentHashes,
    listIncomplete,
    persistNew,
    update,
  }
}

const lnPaymentFromRaw = (result: LnPaymentType): PersistedLnPaymentLookup => ({
  createdAt: result.createdAt,
  status: result.status as PaymentStatus,
  paymentHash: result.paymentHash as PaymentHash,
  paymentRequest: result.paymentRequest as EncodedPaymentRequest,
  sentFromPubkey: result.sentFromPubkey as Pubkey,
  milliSatsAmount: toMilliSatsFromString(result.milliSatsAmount),
  roundedUpAmount: toSats(result.roundedUpAmount),
  confirmedDetails: result.confirmedDetails
    ? {
        confirmedAt: result.confirmedDetails.confirmedAt,
        destination: result.confirmedDetails.destination,
        revealedPreImage: result.confirmedDetails.revealedPreImage,
        roundedUpFee: result.confirmedDetails.roundedUpFee,
        milliSatsFee: result.confirmedDetails.milliSatsFee,
        hopPubkeys: result.confirmedDetails.hopPubkeys,
      }
    : undefined,
  attempts: result.attempts,
  isCompleteRecord: result.isCompleteRecord,
})

const lnPaymentPartialFromRaw = (result: LnPaymentType): LnPaymentPartial => ({
  paymentHash: result.paymentHash as PaymentHash,
  paymentRequest: result.paymentRequest as EncodedPaymentRequest,
  sentFromPubkey: result.sentFromPubkey as Pubkey,
})
