import { checkedToLedgerExternalIdSubstring } from "@/domain/ledger"
import { InputValidationError } from "@/graphql/error"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"

const TxExternalIdSubstring = GT.Scalar({
  name: "TxExternalIdSubstring",
  description: "An external reference id that can be optionally added for transactions.",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({
        message: "Invalid type for TxExternalIdSubstring",
      })
    }
    return validTxExternalIdSubstring(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validTxExternalIdSubstring(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for TxExternalIdSubstring" })
  },
})

function validTxExternalIdSubstring(
  value: string,
): LedgerExternalIdSubstring | InputValidationError {
  const checkedExternalId = checkedToLedgerExternalIdSubstring(value)
  if (checkedExternalId instanceof Error) {
    return new InputValidationError(mapAndParseErrorForGqlResponse(checkedExternalId))
  }
  return checkedExternalId
}

export default TxExternalIdSubstring
