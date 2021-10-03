import { GT } from "@graphql/index"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import LnPaymentSecret from "@graphql/types/scalar/ln-payment-secret"
import SatAmount from "@graphql/types/scalar/sat-amount"
import Timestamp from "@graphql/types/scalar/timestamp"

const LightningPayment = new GT.Object({
  name: "LightningPayment",
  fields: () => ({
    status: { type: GT.String },
    roundedUpFee: { type: SatAmount },
    createdAt: { type: Timestamp },
    confirmedAt: { type: Timestamp },
    amount: { type: SatAmount },
    secret: { type: LnPaymentSecret },
    request: { type: LnPaymentRequest },
    destination: { type: GT.String },
  }),
})

export default LightningPayment
