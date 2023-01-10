import { RepositoryError } from "@domain/errors"
import { decodeInvoice } from "@domain/bitcoin/lightning"
import { LnTxRecorded } from "@domain/ledger"
import { LedgerService } from "@services/ledger"

export const PaymentStatusChecker = async (uncheckedPaymentRequest: string) => {
  const decodedInvoice = decodeInvoice(uncheckedPaymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { paymentHash } = decodedInvoice

  return {
    paymentHash,
    invoiceIsPaid: async (): Promise<boolean | RepositoryError> => {
      const recorded = await LedgerService().isLnTxRecorded(paymentHash)
      if (recorded instanceof Error) return recorded

      return recorded === LnTxRecorded.TRUE
    },
  }
}
