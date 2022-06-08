import { GT } from "@graphql/index"
import LnPaymentPreImage from "@graphql/types/scalar/ln-payment-preimage"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import SatAmount from "@graphql/types/scalar/sat-amount"
import Timestamp from "@graphql/types/scalar/timestamp"

const LightningInvoice = GT.Object<LnInvoiceLookup>({
  name: "LightningInvoice",
  fields: () => ({
    createdAt: { type: GT.NonNull(Timestamp) },
    confirmedAt: { type: Timestamp },
    description: {
      type: GT.NonNull(GT.String),
      resolve: (source) => source.lnInvoice.description,
    },
    expiresAt: {
      type: Timestamp,
      resolve: (source) => source.lnInvoice.expiresAt,
    },
    isSettled: { type: GT.NonNull(GT.Boolean) },
    received: {
      type: GT.NonNull(SatAmount),
      resolve: (source) => source.roundedDownReceived,
    },
    request: {
      type: LnPaymentRequest,
      resolve: (source) => source.lnInvoice.paymentRequest,
    },
    secretPreImage: { type: GT.NonNull(LnPaymentPreImage) },
  }),
})

export default LightningInvoice
