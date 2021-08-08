import { GT } from "@graphql/index"

const LnInvoicePaymentRequest = new GT.Scalar({
  name: "LnInvoicePaymentRequest",
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
  if (value.match(/^ln[A-Za-z0-9]+$/)) {
    return value
  }
  return new Error("Invalid value for LnInvoicePaymentRequest")
}

export default LnInvoicePaymentRequest
