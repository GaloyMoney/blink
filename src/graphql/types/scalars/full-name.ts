import { GT } from "@graphql/index"

const FullName = new GT.Scalar({
  name: "FullName",
  description: "Full name of an API user",
  parseValue(value) {
    return validFullNameValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validFullNameValue(ast.value)
    }
    return new Error("Invalid type for FullName")
  },
})

function validFullNameValue(value) {
  if (value.match(/^[\p{Alpha}][\p{Alpha} -]{3,}/u)) {
    return value
  }
  return new Error("Invalid value for FullName")
}

export default FullName