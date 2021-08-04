// import { MAX_BYTES_FOR_MEMO } from "@config/app"
import { GT } from "@graphql/index"

const Memo = new GT.Scalar({
  name: "Memo",
  parseValue(value) {
    return validMemo(value) ? value : null
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      if (validMemo(ast.value)) {
        return ast.value
      }
      // return new Error("Value is not valid")
    }
    return null
  },
})

function validMemo(value) {
  return value // TODO: pass the error to operations
  // return Buffer.byteLength(value, "utf8") <= MAX_BYTES_FOR_MEMO // BOLT
}

export default Memo
