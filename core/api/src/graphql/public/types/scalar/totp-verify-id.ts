import { GT } from "@/graphql/index"
import { checkedToTotpRegistrationId } from "@/services/kratos"

const TotpRegistrationId = GT.Scalar({
  name: "TotpRegistrationId",
  description: "An id to be passed between set and verify for confirming totp",
  serialize(value) {
    if (typeof value !== "string") {
      return "Invalid value for TotpRegistrationId"
    }
    return checkedToTotpRegistrationId(value)
  },
})

export default TotpRegistrationId
