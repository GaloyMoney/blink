import { Languages } from "@domain/users"
import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

type InternalLang = UserLanguage | ""
type ExternalLang = UserLanguage

const Language = GT.Scalar<InternalLang | InputValidationError, ExternalLang>({
  name: "Language",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for OnChainTxHash" })
    }
    return validLanguageValue(value)
  },
  parseLiteral(valueNode) {
    if (valueNode.kind === GT.Kind.STRING) {
      return validLanguageValue(valueNode.value)
    }
    return new InputValidationError({ message: "Invalid type for Language" })
  },
})

function validLanguageValue(value: string): InternalLang | InputValidationError {
  if (value === "" || value === "DEFAULT") {
    return ""
  }
  if (Languages.includes(value)) {
    return value
  }
  return new InputValidationError({ message: "Invalid value for Language" })
}

export default Language
