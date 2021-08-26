import { GT } from "@graphql/index"

const LnPaymentHash = new GT.Scalar({
  name: "LnPaymentHash",
  parseValue(value) {
    return validkLnPaymentHash(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validkLnPaymentHash(ast.value)
    }
    return new Error("Invalid type for LnPaymentHash")
  },
})

function validkLnPaymentHash(value) {
  // TODO: verify/improve
  if (value.match(/^[a-f0-9]{64}$/i)) {
    return value
  }
  return new Error("Invaild value for LnPaymentHash")
}

export default LnPaymentHash
