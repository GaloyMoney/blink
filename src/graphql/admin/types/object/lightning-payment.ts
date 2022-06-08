import { GT } from "@graphql/index"
import LnPubkey from "@graphql/types/scalar/ln-pubkey"
import Timestamp from "@graphql/types/scalar/timestamp"
import SatAmount from "@graphql/types/scalar/sat-amount"
import LnPaymentStatus from "@graphql/types/scalar/ln-payment-status"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import LnPaymentPreImage from "@graphql/types/scalar/ln-payment-preimage"

const LightningPayment = GT.Object<LnPaymentLookup>({
  name: "LightningPayment",
  fields: () => ({
    status: { type: LnPaymentStatus },
    roundedUpFee: {
      type: SatAmount,
      resolve: (source) => source.confirmedDetails?.roundedUpFee,
    },
    createdAt: { type: Timestamp },
    confirmedAt: {
      type: Timestamp,
      resolve: (source) => source.confirmedDetails?.confirmedAt,
    },
    amount: {
      type: SatAmount,
      resolve: (source) => source.roundedUpAmount,
    },
    revealedPreImage: {
      type: LnPaymentPreImage,
      resolve: (source) => source.confirmedDetails?.revealedPreImage,
    },
    request: {
      type: LnPaymentRequest,
      resolve: (source) => source.paymentRequest,
    },
    destination: {
      type: LnPubkey,
      resolve: (source) => source.confirmedDetails?.destination,
    },
  }),
})

export default LightningPayment
