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
    roundedUpFee: {
      type: SatAmount,
      resolve: (source: LnPaymentLookup) => source.confirmedDetails?.roundedUpFee,
    },
    createdAt: { type: Timestamp },
    confirmedAt: {
      type: Timestamp,
      resolve: (source: LnPaymentLookup) => source.confirmedDetails?.confirmedAt,
    },
    amount: {
      type: SatAmount,
      resolve: (source: LnPaymentLookup) => source.roundedUpAmount,
    },
    revealedPreImage: {
      type: LnPaymentPreImage,
      resolve: (source: LnPaymentLookup) => source.confirmedDetails?.revealedPreImage,
    },
    request: {
      type: LnPaymentRequest,
      resolve: (source: LnPaymentLookup) => source.paymentRequest,
    },
    destination: {
      type: LnPubkey,
      resolve: (source: LnPaymentLookup) => source.confirmedDetails?.destination,
    },
  }),
})

export default LightningPayment
