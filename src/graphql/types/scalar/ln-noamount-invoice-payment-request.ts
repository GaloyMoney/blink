import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const LnNoAmountInvoicePaymentRequest = GT.Scalar({
  name: "LnNoAmountInvoicePaymentRequest",
  description: "BOLT11 lightning invoice payment request that does not include an amount",
  parseValue(value) {
    return validLnNoAmountInvoicePaymentRequest(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnNoAmountInvoicePaymentRequest(ast.value)
    }
    return new InputValidationError({
      message: "Invalid type for LnNoAmountInvoicePaymentRequest",
    })
  },
})

function validLnNoAmountInvoicePaymentRequest(value) {
  // TODO: verify/improve
  if (value.match(/^ln[a-z0-9]+$/i)) {
    return value
  }
  return new InputValidationError({
    message: "Invalid value for LnNoAmountInvoicePaymentRequest",
  })
}

export default LnNoAmountInvoicePaymentRequest
