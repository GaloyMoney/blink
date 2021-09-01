import { MAX_BYTES_FOR_MEMO } from "@config/app"
import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const Memo = new GT.Scalar({
  name: "Memo",
  description: "Text field in a lightning payment transaction",
  parseValue(value) {
    return validMemo(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validMemo(ast.value)
    }
    return new UserInputError("Invalid type for Memo")
  },
})

function validMemo(value) {
  if (Buffer.byteLength(value, "utf8") <= MAX_BYTES_FOR_MEMO) {
    return value
  }
  return new UserInputError("Memo is too long")
}

export default Memo
