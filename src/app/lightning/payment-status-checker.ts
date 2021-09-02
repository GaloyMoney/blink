import { RepositoryError } from "@domain/errors"
import { decodeInvoice } from "@domain/bitcoin/lightning"
import { LedgerService } from "@services/ledger"

export const PaymentStatusChecker = ({ paymentRequest }) => {
  const decodedInvoice = decodeInvoice(paymentRequest)

  if (decodedInvoice instanceof Error) return decodedInvoice

  const { paymentHash } = decodedInvoice

  return {
    invoiceIsPaid: async (): Promise<boolean | RepositoryError> => {
      const ledger = LedgerService()
      const recorded = await ledger.isLnTxRecorded(paymentHash)
      if (recorded instanceof RepositoryError) return recorded
      return recorded
    },
  }
}
