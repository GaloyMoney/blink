import { checkedToIdentifier } from "@/domain/contacts"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const Identifier = GT.Scalar<string | InputValidationError>({
  name: "Identifier",
  description: "Unique value used to identify a contact (e.g., username or lnAddress)",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for Identifier" })
    }
    return validIdentifierValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validIdentifierValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for Identifier" })
  },
})

function validIdentifierValue(value: string): string | InputValidationError {
  const checked = checkedToIdentifier(value)
  if (checked instanceof Error) {
    return new InputValidationError({ message: "Invalid value for Identifier" })
  }
  return checked
}

export default Identifier
