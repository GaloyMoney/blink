import { GT } from "@/graphql/index"
import { InputValidationError } from "@/graphql/error"

const LnAddress = GT.Scalar<string | InputValidationError>({
  name: "LnAddress",
  description: "LNURL Lightning address",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for LnAddress" })
    }
    return validLnAddressValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnAddressValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for LnAddress" })
  },
})

function validLnAddressValue(value: string): string | InputValidationError {
  // TODO: validate ln address
  return value
}

export default LnAddress
