import { checkedToLedgerExternalId } from "@/domain/ledger"
import { InputValidationError } from "@/graphql/error"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"

const TxExternalId = GT.Scalar({
  name: "TxExternalId",
  description: "An external reference id that can be optionally added for transactions.",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for TxExternalId" })
    }
    return validTxExternalId(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validTxExternalId(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for TxExternalId" })
  },
})

function validTxExternalId(value: string): LedgerExternalId | InputValidationError {
  const checkedExternalId = checkedToLedgerExternalId(value)
  if (checkedExternalId instanceof Error) {
    return new InputValidationError(mapAndParseErrorForGqlResponse(checkedExternalId))
  }
  return checkedExternalId
}

export default TxExternalId
