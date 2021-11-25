import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const Hex32Bytes = new GT.Scalar({
  name: "Hex32Bytes",
  description: "Hex-encoded string of 32 bytes",
  parseValue(value) {
    return validHex32Bytes(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validHex32Bytes(ast.value)
    }
    return new UserInputError("Invalid type for Hex32Bytes")
  },
})

function validHex32Bytes(value) {
  const bytes = Buffer.from(value, "hex")

  if (bytes.toString("hex") !== value) {
    return new UserInputError("Hex32Bytes is not valid hex")
  }

  if (Buffer.byteLength(bytes) !== 32) {
    return new UserInputError("Hex32Bytes is not 32 bytes")
  }

  return value
}

export default Hex32Bytes
