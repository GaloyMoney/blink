import { GT } from "@graphql/index"
import LnPubkey from "@graphql/types/scalar/ln-pubkey"
import Timestamp from "@graphql/types/scalar/timestamp"
import SatAmount from "@graphql/types/scalar/sat-amount"
import LnPaymentStatus from "@graphql/types/scalar/ln-payment-status"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import LnPaymentPreImage from "@graphql/types/scalar/ln-payment-preimage"

const LightningPayment = new GT.Object({
  name: "LightningPayment",
  fields: () => ({
    status: { type: LnPaymentStatus },
    roundedUpFee: { type: SatAmount },
    createdAt: { type: Timestamp },
    confirmedAt: { type: Timestamp },
    amount: { type: SatAmount },
    revealedPreImage: { type: LnPaymentPreImage },
    request: { type: LnPaymentRequest },
    destination: { type: LnPubkey },
  }),
})

export default LightningPayment
