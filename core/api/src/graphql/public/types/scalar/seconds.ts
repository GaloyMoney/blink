import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const Seconds = GT.Scalar({
  name: "Seconds",
  description: "(Positive) amount of seconds",
  parseValue(value) {
    if (typeof value !== "string" && typeof value !== "number") {
      return new InputValidationError({ message: "Invalid type for Seconds" })
    }
    return validSecondsAmount(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.INT) {
      return validSecondsAmount(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for Seconds" })
  },
})

function validSecondsAmount(value: string | number) {
  let intValue: number
  if (typeof value === "number") {
    intValue = value
  } else {
    intValue = Number.parseInt(value, 10)
  }

  if (!(Number.isInteger(intValue) && intValue >= 0)) {
    return new InputValidationError({ message: "Invalid value for Seconds" })
  }

  return intValue
}

export default Seconds
