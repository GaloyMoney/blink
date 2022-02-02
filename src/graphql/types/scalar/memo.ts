import { MAX_BYTES_FOR_MEMO } from "@config"
import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const Memo = GT.Scalar({
  name: "Memo",
  description: "Text field in a lightning payment transaction",
  parseValue(value) {
    return validMemo(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validMemo(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for Memo" })
  },
})

function validMemo(value) {
  if (Buffer.byteLength(value, "utf8") <= MAX_BYTES_FOR_MEMO) {
    return value
  }
  return new InputValidationError({ message: "Memo is too long" })
}

export default Memo
