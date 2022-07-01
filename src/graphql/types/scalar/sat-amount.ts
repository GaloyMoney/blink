import { ErrorLevel } from "@domain/shared"
import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"
import { recordExceptionInCurrentSpan } from "@services/tracing"

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
    // TODO: remove trunc and recordExceptionInCurrentSpan once mobile app is fixed
    intValue = Math.trunc(value)
    if (!Number.isInteger(value)) {
      recordExceptionInCurrentSpan({
        error: new InputValidationError({ message: "Float value for SatAmount" }),
        level: ErrorLevel.Warn,
      })
    }
  } else {
    intValue = Number.parseInt(value, 10)
  }
  if (Number.isInteger(intValue) && intValue >= 0) {
    return intValue
  }
  return new InputValidationError({ message: "Invalid value for SatAmount" })
}

export default SatAmount
