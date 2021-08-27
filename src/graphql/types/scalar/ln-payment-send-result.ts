import { GT } from "@graphql/index"

const LnPaymentSendResult = new GT.Enum({
  name: "LnPaymentSendResult",
  values: {
    SUCCESS: { value: "success" },
    FAILURE: { value: "failed" },
    PENDING: { value: "pending" },
    ALREADY_PAID: { value: "already_paid" },
  },
})

export default LnPaymentSendResult
