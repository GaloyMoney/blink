import { GT } from "@/graphql/index"

const LnPaymentStatus = GT.Enum({
  name: "LnPaymentStatus",
  values: {
    PENDING: { value: "pending" },
    FAILED: { value: "failed" },
    SETTLED: { value: "settled" },
  },
})

export default LnPaymentStatus
