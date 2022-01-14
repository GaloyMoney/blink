import { GT } from "@graphql/index"
import LnPaymentPreImage from "@graphql/types/scalar/ln-payment-preimage"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import SatAmount from "@graphql/types/scalar/sat-amount"
import Timestamp from "@graphql/types/scalar/timestamp"

const LightningInvoice = new GT.Object({
  name: "LightningInvoice",
  fields: () => ({
    createdAt: { type: GT.NonNull(Timestamp) },
    confirmedAt: { type: Timestamp },
    description: { type: GT.NonNull(GT.String) },
    expiresAt: { type: Timestamp },
    isSettled: { type: GT.NonNull(GT.Boolean) },
    received: { type: GT.NonNull(SatAmount) },
    request: { type: LnPaymentRequest },
    secretPreImage: { type: GT.NonNull(LnPaymentPreImage) },
  }),
})

export default LightningInvoice
