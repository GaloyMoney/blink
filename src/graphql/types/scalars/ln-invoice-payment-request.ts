import { GT } from "@graphql/index"

const LnInvoicePaymentRequest = new GT.Scalar({
  name: "LnInvoicePaymentRequest",
  parseValue(value) {
    return validLnInvoicePaymentRequest(value) ? value : null
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnInvoicePaymentRequest(ast.value) ? ast.value : null
    }
    return null
  },
})

function validLnInvoicePaymentRequest(value) {
  return value.match(/^ln[A-Za-z0-9]+$/) // TODO: verify/improve
}

export default LnInvoicePaymentRequest
