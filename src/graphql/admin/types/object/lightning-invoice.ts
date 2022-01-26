import { GT } from "@graphql/index"
import LnPaymentPreImage from "@graphql/types/scalar/ln-payment-preimage"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import SatAmount from "@graphql/types/scalar/sat-amount"
import Timestamp from "@graphql/types/scalar/timestamp"

const LightningInvoice = GT.Object({
  name: "LightningInvoice",
  fields: () => ({
    createdAt: { type: GT.NonNull(Timestamp) },
    confirmedAt: { type: Timestamp },
    description: {
      type: GT.NonNull(GT.String),
      resolve: (source: LnInvoiceLookup) => source.lnInvoice.description,
    },
    expiresAt: {
      type: Timestamp,
      resolve: (source: LnInvoiceLookup) => source.lnInvoice.expiresAt,
    },
    isSettled: { type: GT.NonNull(GT.Boolean) },
    received: {
      type: GT.NonNull(SatAmount),
      resolve: (source: LnInvoiceLookup) => source.roundedDownReceived,
    },
    request: {
      type: LnPaymentRequest,
      resolve: (source: LnInvoiceLookup) => source.lnInvoice.paymentRequest,
    },
    secretPreImage: { type: GT.NonNull(LnPaymentPreImage) },
  }),
})

export default LightningInvoice
