import { GT } from "@/graphql/index"

const EndpointUrl = GT.Scalar({
  name: "EndpointUrl",
  description: "Url that will be fetched on events for the account",
  serialize(value) {
    if (typeof value !== "string") {
      return "Invalid value for EndpointUrl"
    }
    return value
  },
})

export default EndpointUrl
