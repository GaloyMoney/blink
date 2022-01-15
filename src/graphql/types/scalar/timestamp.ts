import { GT } from "@graphql/index"

import { UserInputError } from "apollo-server-errors"

type InternalDate = Date
type ExternalDate = number | UserInputError

const Timestamp = GT.Scalar<InternalDate | UserInputError, ExternalDate>({
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
    return new UserInputError("Invalid value for Date")
  },
  parseValue(value) {
    if (typeof value !== "string") {
      return new UserInputError("Invalid type for Date")
    }
    return new Date(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return new Date(parseInt(ast.value, 10))
    }
    return new UserInputError("Invalid type for Date")
  },
})

// TODO: validate date value

export default Timestamp
