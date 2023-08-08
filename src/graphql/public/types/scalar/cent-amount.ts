import { MAX_CENTS } from "@domain/shared"
import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const CentAmount = GT.Scalar({
  name: "CentAmount",
  description: "(Positive) Cent amount (1/100 of a dollar)",
  parseValue(value) {
    if (typeof value !== "string" && typeof value !== "number") {
      return new InputValidationError({ message: "Invalid type for CentAmount" })
    }
    return validCentAmount(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.INT) {
      return validCentAmount(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for CentAmount" })
  },
})

function validCentAmount(value: string | number) {
  let intValue: number
  if (typeof value === "number") {
    intValue = value
  } else {
    intValue = Number.parseInt(value, 10)
  }

  if (!(Number.isInteger(intValue) && intValue >= 0)) {
    return new InputValidationError({ message: "Invalid value for CentAmount" })
  }

  if (intValue > MAX_CENTS.amount) {
    return new InputValidationError({ message: "Value too big for CentAmount" })
  }

  return intValue
}

export default CentAmount
