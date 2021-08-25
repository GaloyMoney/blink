import { GT } from "@graphql/index"

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
    return new Error("Invalid type for SatAmount")
  },
})

function validSatAmount(value) {
  const intValue = Number.parseInt(value, 10)
  if (Number.isInteger(intValue) && intValue >= 0) {
    return intValue
  }
  return new Error("Invalid value for SatAmount")
}

export default SatAmount
