import { GT } from "@/graphql/index"
import { checkedToEmailRegistrationId } from "@/services/kratos"

const EmailRegistrationId = GT.Scalar({
  name: "EmailRegistrationId",
  description:
    "An id to be passed between registrationInitiate and registrationValidate for confirming email",
  serialize(value) {
    if (typeof value !== "string") {
      return "Invalid value for EmailRegistrationId"
    }
    return checkedToEmailRegistrationId(value)
  },
})

export default EmailRegistrationId
