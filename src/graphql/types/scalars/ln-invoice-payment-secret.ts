import { GT } from "@graphql/index"

const LnInvoicePaymentSecret = new GT.Scalar({
  name: "LnInvoicePaymentSecret",
  parseValue(value) {
    return validLnInvoicePaymentSecret(value) ? value : null
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnInvoicePaymentSecret(ast.value) ? ast.value : null
    }
    return null
  },
})

function validLnInvoicePaymentSecret(value) {
  return value.match(/^[A-Fa-f0-9]{64}$/) // TODO: verify/improve
}

export default LnInvoicePaymentSecret
