import { GT } from "@graphql/index"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import LnPaymentSecret from "@graphql/types/scalar/ln-payment-secret"
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
    secretPreImage: { type: GT.NonNull(LnPaymentSecret) },
  }),
})

export default LightningInvoice
