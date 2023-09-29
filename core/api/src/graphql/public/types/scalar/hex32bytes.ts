import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const Hex32Bytes = GT.Scalar({
  name: "Hex32Bytes",
  description: "Hex-encoded string of 32 bytes",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for Hex32Bytes" })
    }
    return validHex32Bytes(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validHex32Bytes(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for Hex32Bytes" })
  },
})

function validHex32Bytes(value: string) {
  const bytes = Buffer.from(value, "hex")

  if (bytes.toString("hex") !== value) {
    return new InputValidationError({ message: "Hex32Bytes is not valid hex" })
  }

  if (Buffer.byteLength(bytes) !== 32) {
    return new InputValidationError({ message: "Hex32Bytes is not 32 bytes" })
  }

  return value
}

export default Hex32Bytes
