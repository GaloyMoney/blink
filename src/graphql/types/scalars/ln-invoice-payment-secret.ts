import { GT } from "@graphql/index"

const LnInvoicePaymentSecret = new GT.Scalar({
  name: "LnInvoicePaymentSecret",
  parseValue(value) {
    return validLnInvoicePaymentSecret(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnInvoicePaymentSecret(ast.value)
    }
    return new Error("Invalid type for LnInvoicePaymentSecret")
  },
})

function validLnInvoicePaymentSecret(value) {
  // TODO: verify/improve
  if (value.match(/^[A-Fa-f0-9]{64}$/)) {
    return value
  }
  return new Error("Invalid value for LnInvoicePaymentSecret")
}

export default LnInvoicePaymentSecret
