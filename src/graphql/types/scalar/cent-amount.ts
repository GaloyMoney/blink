import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const CentAmount = GT.Scalar({
  name: "CentAmount",
  description: "(Positive) Cent amount (1/100 of a dollar)",
  parseValue(value) {
    return validCentAmount(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.INT) {
      return validCentAmount(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for CentAmount" })
  },
})

function validCentAmount(value) {
  const intValue = Number.parseInt(value, 10)
  if (Number.isInteger(intValue) && intValue >= 0) {
    return intValue
  }
  return new InputValidationError({ message: "Invalid value for CentAmount" })
}

export default CentAmount
