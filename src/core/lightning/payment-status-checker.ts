import { LnInvoiceLookupError } from "@domain/errors"
import { decodeInvoice } from "@domain/ln-invoice"
import { InvoiceUser } from "@services/mongoose/schema"

const PaymentStatusChecker = ({ paymentRequest, lookupToken }) => {
  const decodedInvoice = decodeInvoice(paymentRequest)

  if (decodedInvoice instanceof Error) return decodedInvoice

  const { paymentHash, paymentSecret } = decodedInvoice

  // TODO: Improve the following check with a non public payment secret
  if (paymentSecret !== lookupToken) {
    return new LnInvoiceLookupError("Invalid invoice data")
  }

  return {
    invoiceIsPaid: async (): Promise<boolean | LnInvoiceLookupError> => {
      const invoiceUser = await InvoiceUser.findOne({ _id: paymentHash })
      if (!invoiceUser) {
        return new LnInvoiceLookupError("Invaild invoice data")
      }
      return invoiceUser.paid
    },
  }
}

export default PaymentStatusChecker
