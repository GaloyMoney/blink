import { GT } from "@/graphql/index"
import { checkedToTotpCode } from "@/services/kratos"

const TotpCode = GT.Scalar({
  name: "TotpCode",
  description: "A time-based one-time password",
  serialize(value) {
    if (typeof value !== "string") {
      return "Invalid value for TotpCode"
    }
    return checkedToTotpCode(value)
  },
})

export default TotpCode
