import { Languages } from "@/domain/users"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

type InternalLang = UserLanguage | ""
type ExternalLang = UserLanguage

// TODO: this type would probably benefits to been undefined.
// when we don't know the language of a user, I (nb) think it's better to not return
// anything and let the frontend deal with it

const Language = GT.Scalar<InternalLang | InputValidationError, ExternalLang>({
  name: "Language",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for Language" })
    }
    return validLanguageValue(value)
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== GT.Kind.STRING) {
      return new InputValidationError({ message: "Invalid type for Language" })
    }
    return validLanguageValue(valueNode.value)
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
