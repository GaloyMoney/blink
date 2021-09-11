import { ValidationError } from "@domain/errors"
import { toSats } from ".."

export const LnInvoiceValidator = (invoice: LnInvoice): LnInvoiceValidator => {
  const validateToSend = (amount?: Satoshis): { amount: Satoshis } | ValidationError => {
    if (invoice.amount && amount && invoice.amount !== amount) {
      const error = `Invoice amount and passed amount do not match for payment`
      return new ValidationError(error)
    }

    if (!invoice.amount && !amount) {
      const error = "Invoice is a zero-amount invoice and no amount was passed separately"
      return new ValidationError(error)
    }

    const finalAmount = amount ? amount : invoice.amount ? invoice.amount : toSats(0)
    if (finalAmount <= 0) {
      const error = "An invalid zero or negative amount was passed for payment"
      return new ValidationError(error)
    }

    return { amount: finalAmount }
  }
  return { validateToSend }
}
