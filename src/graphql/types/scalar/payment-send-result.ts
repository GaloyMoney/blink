import { GT } from "@graphql/index"

const PaymentSendResult = GT.Enum({
  name: "PaymentSendResult",
  values: {
    SUCCESS: { value: "success" },
    FAILURE: { value: "failed" },
    PENDING: { value: "pending" },
    ALREADY_PAID: { value: "already_paid" },
  },
})

export default PaymentSendResult
