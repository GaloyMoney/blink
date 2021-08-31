import { GT } from "@graphql/index"

const ContactAlias = new GT.Scalar({
  name: "ContactAlias",
  description: "Full name of an API user",
  parseValue(value) {
    return validContactAliasValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validContactAliasValue(ast.value)
    }
    return new Error("Invalid type for ContactAlias")
  },
})

function validContactAliasValue(value) {
  if (value.match(/^[\p{Alpha}][\p{Alpha} -]{3,}/u)) {
    return value
  }
  return new Error("Invalid value for ContactAlias")
}

export default ContactAlias
