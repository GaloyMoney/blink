import { GT } from "@graphql/index"

const Phone = new GT.Scalar({
  name: "Phone",
  parseValue(value) {
    return validPhoneValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validPhoneValue(ast.value)
    }
    return new Error("Invalid type for Phone")
  },
})

function validPhoneValue(value) {
  // TODO: more accurate phone rexp
  if (value.match(/^\+[0-9]{7,}$/)) {
    return value
  }
  return new Error("Invalid value for Phone")
}

export default Phone
