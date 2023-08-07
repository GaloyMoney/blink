import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

type InternalDate = Date
type ExternalDate = number | InputValidationError

const Timestamp = GT.Scalar<InternalDate | InputValidationError, ExternalDate>({
  name: "Timestamp",
  description:
    "Timestamp field, serialized as Unix time (the number of seconds since the Unix epoch)",
  serialize(value) {
    if (value instanceof Date) {
      return Math.floor(value.getTime() / 1000)
    }
    if (typeof value === "number") {
      return value
    }
    return new InputValidationError({ message: "Invalid value for Date" })
  },
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for Date" })
    }
    return new Date(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return new Date(parseInt(ast.value, 10))
    }
    return new InputValidationError({ message: "Invalid type for Date" })
  },
})

// TODO: validate date value

export default Timestamp
