import { GT } from "@graphql/index"

const Phone = new GT.Scalar({
  name: "Phone",
  description: "Phone number which includes country code",
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
  // ?: Use ^(\+|00)[1-9][0-9 \-\(\)\.]{7,}$ and strip \D
  if (value.match(/^\+[1-9][0-9]{7,}$/)) {
    return value
  }
  return new Error("Invalid value for Phone")
}

export default Phone
