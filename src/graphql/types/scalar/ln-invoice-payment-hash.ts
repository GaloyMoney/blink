import { GT } from "@graphql/index"

const LnInvoicePaymentHash = new GT.Scalar({
  name: "LnInvoicePaymentHash",
  parseValue(value) {
    return validkLnInvoicePaymentHash(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validkLnInvoicePaymentHash(ast.value)
    }
    return new Error("Invalid type for LnInvoicePaymentHash")
  },
})

function validkLnInvoicePaymentHash(value) {
  // TODO: verify/improve
  if (value.match(/^[A-Fa-f0-9]{64}$/)) {
    return value
  }
  return new Error("Invaild value for LnInvoicePaymentHash")
}

export default LnInvoicePaymentHash
