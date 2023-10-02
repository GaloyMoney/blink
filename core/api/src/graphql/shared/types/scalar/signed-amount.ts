import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const SignedAmount = GT.Scalar({
  name: "SignedAmount",
  // FIXME: should be SignedInteger. value is tested for integer
  description: "An amount (of a currency) that can be negative (e.g. in a transaction)",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for SignedAmount" })
    }
    return validSignedAmount(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.INT) {
      return validSignedAmount(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for SignedAmount" })
  },
})

function validSignedAmount(value: string) {
  let intValue: number
  if (typeof value === "number") {
    intValue = value
  } else {
    intValue = Number.parseInt(value, 10)
  }
  if (Number.isInteger(intValue)) {
    return value
  }
  return new InputValidationError({ message: "Invalid value for SignedAmount" })
}

export default SignedAmount
