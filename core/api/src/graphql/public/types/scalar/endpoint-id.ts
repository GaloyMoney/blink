import { GT } from "@/graphql/index"

const EndpointId = GT.Scalar({
  name: "EndpointId",
  serialize(value) {
    if (typeof value !== "string") {
      return "Invalid value for EndpointId"
    }
    return value
  },
})

export default EndpointId
