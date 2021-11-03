import { UnknownRepositoryError } from "@domain/errors"
import { LnPayment } from "@services/lnd/schema"

export const LnPaymentsRepository = (): ILnPaymentsRepository => {
  const update = async (
    payment: LnPaymentLookup,
  ): Promise<LnPaymentLookup | RepositoryError> => {
    try {
      const result = await LnPayment.findOneAndUpdate(
        { paymentHash: payment.paymentHash },
        payment,
        { upsert: true },
      )
      return result
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    update,
  }
}
