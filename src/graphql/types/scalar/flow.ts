import { GT } from "@graphql/index"
import { checkedToFlowId } from "@services/kratos"

const Flow = GT.Scalar({
  name: "Flow",
  description:
    "A flow to be passed between request code and logging api when using email",
  serialize(value) {
    if (typeof value !== "string") {
      return "Invalid value for Flow"
    }
    return checkedToFlowId(value)
  },
})

export default Flow
