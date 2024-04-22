import { GT } from "@/graphql/index"
import LnPubkey from "@/graphql/shared/types/scalar/ln-pubkey"
import Timestamp from "@/graphql/shared/types/scalar/timestamp"
import SatAmount from "@/graphql/shared/types/scalar/sat-amount"
import LnPaymentStatus from "@/graphql/shared/types/scalar/ln-payment-status"
import LnPaymentRequest from "@/graphql/shared/types/scalar/ln-payment-request"
import LnPaymentPreImage from "@/graphql/shared/types/scalar/ln-payment-preimage"

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
