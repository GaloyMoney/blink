import { checkedToPubkey } from "@/domain/bitcoin/lightning"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const LnPubkey = GT.Scalar({
  name: "LnPubkey",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for LnPubkey" })
    }
    return validLnPubkey(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnPubkey(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for LnPubkey" })
  },
})

function validLnPubkey(value: string): Pubkey | InputValidationError {
  const pubkey = checkedToPubkey(value)
  if (pubkey instanceof Error) {
    return new InputValidationError({ message: "Invalid value for LnPubkey" })
  }
  return pubkey
}

export default LnPubkey
