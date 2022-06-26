import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const SatAmount = GT.Scalar({
  name: "SatAmount",
  description: "(Positive) Satoshi amount",
  parseValue(value) {
    if (typeof value !== "string" && typeof value !== "number") {
      return new InputValidationError({ message: "Invalid type for SatAmount" })
    }
    return validSatAmount(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.INT) {
      return validSatAmount(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for SatAmount" })
  },
})

function validSatAmount(value: string | number) {
  let intValue: number
  if (typeof value === "number") {
    intValue = value
  } else {
    intValue = Number.parseInt(value, 10)
  }
  if (Number.isInteger(intValue) && intValue >= 0) {
    return intValue
  }
  return new InputValidationError({ message: "Invalid value for SatAmount" })
}

export default SatAmount
