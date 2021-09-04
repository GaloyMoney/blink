import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const Timestamp = new GT.Scalar({
  name: "Timestamp",
  description:
    "Date field, serialized as the number of milliseconds since the Unix Epoch",
  // TODO: db work for dates
  parseValue(value) {
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
