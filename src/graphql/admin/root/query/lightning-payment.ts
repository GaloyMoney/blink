import { GT } from "@graphql/index"
import { lookupPaymentByHash } from "@app/lightning"
import LightningPayment from "@graphql/admin/types/object/lightning-payment"

const LightningPaymentQuery = GT.Field({
  type: GT.NonNull(LightningPayment),
  args: {
    hash: { type: GT.NonNull(GT.String) },
  },
  resolve: async (_, { hash }) => {
    if (hash instanceof Error) throw hash

    const lightningPayment = await lookupPaymentByHash(hash)
    if (lightningPayment instanceof Error) throw lightningPayment

    return lightningPayment
  },
})

export default LightningPaymentQuery
