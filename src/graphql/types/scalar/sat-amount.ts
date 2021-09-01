import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const SatAmount = new GT.Scalar({
  name: "SatAmount",
  description: "(Positive) Satoshi amount (i.g. quiz earning)",
  parseValue(value) {
    return validSatAmount(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.INT) {
      return validSatAmount(ast.value)
    }
    return new UserInputError("Invalid type for SatAmount")
  },
})

function validSatAmount(value) {
  const intValue = Number.parseInt(value, 10)
  if (Number.isInteger(intValue) && intValue >= 0) {
    return intValue
  }
  return new UserInputError("Invalid value for SatAmount")
}

export default SatAmount
