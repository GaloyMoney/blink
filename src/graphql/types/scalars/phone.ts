import { GT } from "@graphql/index"

const Phone = new GT.Scalar({
  name: "Phone",
  parseValue(value) {
    return validPhoneValue(value) ? value : null
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validPhoneValue(ast.value) ? ast.value : null
    }
    return null
  },
})

function validPhoneValue(value) {
  return value.match(/^\+[0-9]{7,}$/) // TODO: more accurate phone rexp
}

export default Phone
