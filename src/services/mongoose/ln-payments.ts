import { toSats } from "@domain/bitcoin"
import {
  CouldNotFindLnPaymentFromHashError,
  UnknownRepositoryError,
} from "@domain/errors"
import { LnPayment } from "@services/lnd/schema"

export const LnPaymentsRepository = (): ILnPaymentsRepository => {
  const findByPaymentHash = async (
    paymentHash: PaymentHash,
  ): Promise<LnPayment | RepositoryError> => {
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
  ): Promise<LnPayment | RepositoryError> => {
    try {
      const result = await LnPayment.findOneAndUpdate(
        { paymentHash: payment.paymentHash },
        payment,
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
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

const lnPaymentFromRaw = (result: LnPaymentType): LnPayment => ({
  id: result.id as PaymentLedgerId,
  createdAt: result.createdAt as Date,
  status: result.status as PaymentStatus,
  paymentRequest: result.paymentRequest as EncodedPaymentRequest | undefined,
  paymentHash: result.paymentHash as PaymentHash,
  paymentDetails: {
    confirmedAt: (result.paymentDetails.confirmedAt as Date) || undefined,
    destination: result.paymentDetails.destination as Pubkey,
    milliSatsFee: result.paymentDetails.milliSatsFee as MilliSatoshis,
    milliSatsAmount: result.paymentDetails.milliSatsAmount as MilliSatoshis,
    paths: result.paymentDetails.paths as RawPaths,
    roundedUpFee: toSats(result.paymentDetails.roundedUpFee),
    secret: (result.paymentDetails.secret as PaymentSecret) || undefined,
    amount: toSats(result.paymentDetails.amount),
  },
})
