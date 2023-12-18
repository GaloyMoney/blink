import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const ContactAlias = GT.Scalar({
  name: "ContactAlias",
  description:
    "An alias name that a user can set for a wallet (with which they have transactions)",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for AuthToken" })
    }
    return validContactAliasValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validContactAliasValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for ContactAlias" })
  },
})

function validContactAliasValue(value: string) {
  if (value.match(/^[\p{Alpha}][\p{Alpha} -]{3,}/u)) {
    return value
  }
  return new InputValidationError({ message: "Invalid value for ContactAlias" })
}

export default ContactAlias
