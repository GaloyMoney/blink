import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

// TODO: Update database values and this map
const languages = {
  "": "", // used for the "DEFAULT" setting
  "en": "en-US",
  "es": "es-SV",
} as const

type InternalLang = keyof typeof languages
type ExternalLang = ValueOf<typeof languages>

const Language = GT.Scalar<InternalLang | InputValidationError, ExternalLang>({
  name: "Language",
  serialize(value) {
    return languages[value as InternalLang]
  },
  parseValue(value) {
    return validLanguageValue(value)
  },
  parseLiteral(valueNode) {
    if (valueNode.kind === GT.Kind.STRING) {
      return validLanguageValue(valueNode.value)
    }
    return new InputValidationError({ message: "Invalid type for Language" })
  },
})

function validLanguageValue(value): InternalLang | InputValidationError {
  if (value) {
    if (value === "DEFAULT") {
      return ""
    }
    const languageEntry = Object.entries(languages).find(([, v]) => v === value)
    if (languageEntry) {
      return languageEntry[0] as InternalLang
    }
  }
  return new InputValidationError({ message: "Invalid value for Language" })
}

export default Language
