import { GT } from "@graphql/index"
import { Lightning } from "@app"
import PaymentHash from "@graphql/types/scalar/payment-hash"
import LightningPayment from "@graphql/admin/types/object/lightning-payment"

const LightningPaymentQuery = GT.Field({
  type: GT.NonNull(LightningPayment),
  args: {
    hash: { type: GT.NonNull(PaymentHash) },
  },
  resolve: async (_, { hash }) => {
    if (hash instanceof Error) throw hash

    const lightningPayment = await Lightning.lookupPaymentByHash(hash)
    if (lightningPayment instanceof Error) throw lightningPayment

    return lightningPayment
  },
})

export default LightningPaymentQuery
