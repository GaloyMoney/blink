import { AuthorizationError, RepositoryError } from "@domain/errors"
import { decodeInvoice } from "@domain/ln-invoice"
import { MakeInvoicesRepo } from "@services/mongoose/invoices"

const PaymentStatusChecker = ({ paymentRequest, lookupToken }) => {
  const decodedInvoice = decodeInvoice(paymentRequest)

  if (decodedInvoice instanceof Error) return decodedInvoice

  const { paymentHash, paymentSecret } = decodedInvoice

  // TODO: Improve the following check with a non public payment secret
  if (paymentSecret !== lookupToken) {
    return new AuthorizationError("Invalid lookup token")
  }

  return {
    invoiceIsPaid: async (): Promise<boolean | RepositoryError> => {
      const repo = MakeInvoicesRepo()
      const walletInvoice = await repo.findByPaymentHash(paymentHash)
      if (walletInvoice instanceof RepositoryError) return walletInvoice
      return walletInvoice.paid
    },
  }
}

export default PaymentStatusChecker
