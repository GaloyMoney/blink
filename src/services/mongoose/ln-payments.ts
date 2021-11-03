import { toSats } from "@domain/bitcoin"
import { UnknownRepositoryError } from "@domain/errors"
import { LnPayment } from "@services/lnd/schema"

export const LnPaymentsRepository = (): ILnPaymentsRepository => {
  const update = async (
    payment: LnPaymentLookup,
  ): Promise<LnPayment | RepositoryError> => {
    try {
      const result = await LnPayment.findOneAndUpdate(
        { paymentHash: payment.paymentHash },
        payment,
        { upsert: true, new: true },
      )
      return lnPaymentFromRaw(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    update,
  }
}

const lnPaymentFromRaw = (result: LnPaymentType): LnPayment => ({
  id: result.id as PaymentId,
  status: result.status as PaymentStatus,
  confirmedAt: result.confirmedAt as Date | undefined,
  createdAt: result.createdAt as Date,
  destination: result.destination as Pubkey,
  milliSatsFee: result.milliSatsFee as MilliSatoshis,
  paymentHash: result.paymentHash as PaymentHash,
  milliSatsAmount: result.milliSatsAmount as MilliSatoshis,
  paths: result.paths as RawPaths,
  paymentRequest: result.paymentRequest as EncodedPaymentRequest | undefined,
  roundedUpFee: toSats(result.roundedUpFee),
  secret: result.secret as PaymentSecret,
  amount: toSats(result.amount),
})
