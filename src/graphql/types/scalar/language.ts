import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

// TODO: Update database values and this map
const languages = {
  "": "DEFAULT",
  "en": "en-US",
  "es": "es-SV",
} as const

type InternalLang = keyof typeof languages
type ExternalLang = ValueOf<typeof languages>

const Language = GT.Scalar<InternalLang | UserInputError, ExternalLang>({
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
    return new UserInputError("Invalid type for Language")
  },
})

function validLanguageValue(value): InternalLang | UserInputError {
  const languageEntry = Object.entries(languages).find(([, v]) => v === value)
  if (languageEntry) {
    return languageEntry[0] as InternalLang
  }
  return new UserInputError("Invalid value for Language")
}

export default Language
