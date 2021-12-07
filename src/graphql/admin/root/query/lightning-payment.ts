import { GT } from "@graphql/index"
import { lookupPaymentByHash } from "@app/lightning"
import PaymentHash from "@graphql/types/scalar/payment-hash"
import LightningPayment from "@graphql/admin/types/object/lightning-payment"
import { mapError } from "@graphql/error-map"

const LightningPaymentQuery = GT.Field({
  type: GT.NonNull(LightningPayment),
  args: {
    hash: { type: GT.NonNull(PaymentHash) },
  },
  resolve: async (_, { hash }) => {
    if (hash instanceof Error) {
      return { errors: [{ message: hash.message }] }
    }

    const lightningPayment = await lookupPaymentByHash(hash)
    if (lightningPayment instanceof Error) {
      return { errors: [{ message: mapError(lightningPayment).message }] }
    }

    return lightningPayment
  },
})

export default LightningPaymentQuery
