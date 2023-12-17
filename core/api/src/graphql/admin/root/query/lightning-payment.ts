import { GT } from "@/graphql/index"
import { Lightning } from "@/app"
import PaymentHash from "@/graphql/shared/types/scalar/payment-hash"
import LightningPayment from "@/graphql/admin/types/object/lightning-payment"
import { mapError } from "@/graphql/error-map"
import { LnPaymentsRepository } from "@/services/mongoose"

const LightningPaymentQuery = GT.Field({
  type: GT.NonNull(LightningPayment),
  args: {
    hash: { type: GT.NonNull(PaymentHash) },
  },
  resolve: async (_, { hash }) => {
    if (hash instanceof Error) throw hash

    const lightningPayment = await LnPaymentsRepository().findByPaymentHash(hash)

    if (lightningPayment instanceof Error || !lightningPayment.isCompleteRecord) {
      const lightningPaymentFromLnd = await Lightning.lookupPaymentByHash(hash)
      if (lightningPaymentFromLnd instanceof Error) {
        throw mapError(lightningPaymentFromLnd)
      }
      const paymentRequest = !(lightningPayment instanceof Error)
        ? lightningPayment.paymentRequest
        : "paymentRequest" in lightningPaymentFromLnd
          ? lightningPaymentFromLnd.paymentRequest
          : undefined

      return {
        ...lightningPaymentFromLnd,
        paymentRequest,
      }
    }

    return lightningPayment
  },
})

export default LightningPaymentQuery
