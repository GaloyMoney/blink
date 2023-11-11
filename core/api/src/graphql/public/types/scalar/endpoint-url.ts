import { URL } from "url"

import { GT } from "@/graphql/index"
import { InputValidationError } from "@/graphql/error"

const EndpointUrl = GT.Scalar({
  name: "EndpointUrl",
  description: "Url that will be fetched on events for the account",
  parseValue(value) {
    if (typeof value === "string") {
      return validUrlValue(value)
    }
    return new InputValidationError({ message: "Invalid type for EndpointUrl" })
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validUrlValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for EndpointUrl" })
  },
})

function validUrlValue(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return new InputValidationError({ message: "Invalid value for EndpointUrl" })
    }
    return value
  } catch (error) {
    return new InputValidationError({ message: "Invalid value for EndpointUrl" })
  }
}

export default EndpointUrl
