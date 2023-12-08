import { GT } from "@/graphql/index"
import { InputValidationError } from "@/graphql/error"

const Lnurl = GT.Scalar<string | InputValidationError>({
  name: "Lnurl",
  description: "Lnurl string",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for Lnurl" })
    }
    return validLnurlValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnurlValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for Lnurl" })
  },
})

function validLnurlValue(value: string): string | InputValidationError {
  // TODO: validate ln address
  return value
}

export default Lnurl
