import { checkedToExternalId } from "@/domain/accounts"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const ExternalId = GT.Scalar<ExternalId | InputValidationError>({
  name: "ExternalId",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for ExternalId" })
    }
    return validExternalIdValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validExternalIdValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for ExternalId" })
  },
})

function validExternalIdValue(value: string): ExternalId | InputValidationError {
  const checkedExternalId = checkedToExternalId(value)
  if (checkedExternalId instanceof Error) {
    return new InputValidationError({ message: "Invalid value for ExternalId" })
  }
  return checkedExternalId
}

export default ExternalId
