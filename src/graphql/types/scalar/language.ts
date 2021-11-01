import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

// TODO: Update database values and this map
const languages = {
  "": "DEFAULT",
  "en": "en-US",
  "es": "es-SV",
}

const Language = new GT.Scalar({
  name: "Language",
  serialize(value) {
    return languages[value]
  },
  parseValue(value) {
    return validLanguageValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLanguageValue(ast.value)
    }
    return new UserInputError("Invalid type for Language")
  },
})

function validLanguageValue(value) {
  const languageEntry = Object.entries(languages).find(([, v]) => v === value)
  if (languageEntry) {
    return languageEntry[0]
  }
  return new UserInputError("Invalid value for Language")
}

export default Language
