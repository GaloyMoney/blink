import { MAX_BYTES_FOR_MEMO } from "@config/app"
import { GT } from "@graphql/index"

const Memo = new GT.Scalar({
  name: "Memo",
  parseValue(value) {
    return validMemo(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validMemo(ast.value)
    }
    return new Error("Invalid type for Memo")
  },
})

function validMemo(value) {
  if (Buffer.byteLength(value, "utf8") <= MAX_BYTES_FOR_MEMO) {
    return value
  }
  return new Error("Memo is too long")
}

export default Memo
