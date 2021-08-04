import { GT } from "@graphql/index"

const LnInvoiceSecret = new GT.Scalar({
  name: "LnInvoiceSecret",
  parseValue(value) {
    return validLnInvoiceSecret(value) ? value : null
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnInvoiceSecret(ast.value) ? ast.value : null
    }
    return null
  },
})

function validLnInvoiceSecret(value) {
  return value.match(/^[A-Za-z0-9]+$/) // TODO: verify/improve
}

export default LnInvoiceSecret
