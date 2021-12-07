import { GT } from "@graphql/index"
import { Lightning } from "@app"
import PaymentHash from "@graphql/types/scalar/payment-hash"
import LightningInvoice from "@graphql/admin/types/object/lightning-invoice"

const LightningInvoiceQuery = GT.Field({
  type: GT.NonNull(LightningInvoice),
  args: {
    hash: { type: GT.NonNull(PaymentHash) },
  },
  resolve: async (_, { hash }) => {
    if (hash instanceof Error) throw hash

    const lightningInvoice = await Lightning.lookupInvoiceByHash(hash)

    if (lightningInvoice instanceof Error) throw lightningInvoice

    return lightningInvoice
  },
})

export default LightningInvoiceQuery
