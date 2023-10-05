import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const LnNoAmountInvoicePaymentRequest = GT.Scalar({
  name: "LnNoAmountInvoicePaymentRequest",
  description: "BOLT11 lightning invoice payment request that does not include an amount",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for LnPaymentRequest" })
    }
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

function validLnNoAmountInvoicePaymentRequest(value: string) {
  // TODO: add network type
  // TODO: limit length of the invoice
  if (value.match(/^ln[a-z0-9]+$/i)) {
    return value
  }
  return new InputValidationError({
    message: "Invalid value for LnNoAmountInvoicePaymentRequest",
  })
}

export default LnNoAmountInvoicePaymentRequest
