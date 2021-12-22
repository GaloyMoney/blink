import { toMilliSatsFromString, toSats } from "@domain/bitcoin"
import {
  CouldNotFindLnPaymentFromHashError,
  UnknownRepositoryError,
} from "@domain/errors"
import { LnPayment } from "@services/lnd/schema"

export const LnPaymentsRepository = (): ILnPaymentsRepository => {
  const findByPaymentHash = async (
    paymentHash: PaymentHash,
  ): Promise<LnPaymentLookup | RepositoryError> => {
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

  const update = async (
    payment: LnPaymentLookup,
  ): Promise<LnPaymentLookup | RepositoryError> => {
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
    update,
  }
}

const lnPaymentFromRaw = (result: LnPaymentType): LnPaymentLookup => ({
  createdAt: result.createdAt,
  status: result.status as PaymentStatus,
  paymentHash: result.paymentHash as PaymentHash,
  paymentRequest: result.paymentRequest as EncodedPaymentRequest,
  milliSatsAmount: toMilliSatsFromString(result.milliSatsAmount),
  roundedUpAmount: toSats(result.roundedUpAmount),
  confirmedDetails: result.confirmedDetails
    ? {
        confirmedAt: result.confirmedDetails.confirmedAt,
        destination: result.confirmedDetails.destination,
        revealedPreImage: result.confirmedDetails.revealedPreImage,
        roundedUpFee: result.confirmedDetails.roundedUpFee,
        milliSatsFee: result.confirmedDetails.milliSatsFee,
        // cast away from CoreMongooseArray type
        hopPubkeys: result.confirmedDetails.hopPubkeys
          ? [...result.confirmedDetails.hopPubkeys]
          : [],
      }
    : undefined,
  // cast away from CoreMongooseArray type
  attempts: result.attempts ? [...result.attempts] : [],
})

const lnPaymentPartialFromRaw = (result: LnPaymentType): LnPaymentPartial => ({
  paymentHash: result.paymentHash as PaymentHash,
  paymentRequest: result.paymentRequest as EncodedPaymentRequest,
})
