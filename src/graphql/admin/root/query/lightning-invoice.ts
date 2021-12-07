import { GT } from "@graphql/index"
import { lookupInvoiceByHash } from "@app/lightning"
import PaymentHash from "@graphql/types/scalar/payment-hash"
import LightningInvoice from "@graphql/admin/types/object/lightning-invoice"
import { mapError } from "@graphql/error-map"

const LightningInvoiceQuery = GT.Field({
  type: GT.NonNull(LightningInvoice),
  args: {
    hash: { type: GT.NonNull(PaymentHash) },
  },
  resolve: async (_, { hash }) => {
    if (hash instanceof Error) {
      return { errors: [{ message: hash.message }] }
    }

    const lightningInvoice = await lookupInvoiceByHash(hash)

    if (lightningInvoice instanceof Error) {
      return { errors: [{ message: mapError(lightningInvoice).message }] }
    }

    return lightningInvoice
  },
})

export default LightningInvoiceQuery
