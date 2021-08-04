import { GT } from "@graphql/index"

const LnInvoicePaymentHash = new GT.Scalar({
  name: "LnInvoicePaymentHash",
  parseValue(value) {
    return validLnInvoicePaymentHash(value) ? value : null
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnInvoicePaymentHash(ast.value) ? ast.value : null
    }
    return null
  },
})

function validLnInvoicePaymentHash(value) {
  return value.match(/^[A-Fa-f0-9]{64}$/) // TODO: verify/improve
}

export default LnInvoicePaymentHash
