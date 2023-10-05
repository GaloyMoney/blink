import { GT } from "@/graphql/index"
import { InputValidationError } from "@/graphql/error"

const Minutes = GT.Scalar({
  name: "Minutes",
  description: "(Positive) amount of minutes",
  parseValue(value) {
    if (typeof value !== "string" && typeof value !== "number") {
      return new InputValidationError({ message: "Invalid type for Minutes" })
    }
    return validMinutesAmount(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.INT) {
      return validMinutesAmount(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for Minutes" })
  },
})

function validMinutesAmount(value: string | number) {
  let intValue: number
  if (typeof value === "number") {
    intValue = value
  } else {
    intValue = Number.parseInt(value, 10)
  }

  if (!(Number.isInteger(intValue) && intValue >= 0)) {
    return new InputValidationError({ message: "Invalid value for Minutes" })
  }

  return intValue
}

export default Minutes
