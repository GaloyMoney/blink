import { GT } from "@graphql/index"

const LnInvoicePaymentRequest = new GT.Scalar({
  name: "LnInvoicePaymentRequest",
  description: "BOLT11 lightning invoice payment request with the amount included",
  parseValue(value) {
    return validLnInvoicePaymentRequest(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnInvoicePaymentRequest(ast.value)
    }
    return new Error("Invalid type for LnInvoicePaymentRequest")
  },
})

function validLnInvoicePaymentRequest(value) {
  // TODO: verify/improve
  if (value.match(/^ln[a-z0-9]+$/i)) {
    return value
  }
  return new Error("Invalid value for LnInvoicePaymentRequest")
}

export default LnInvoicePaymentRequest
