import { RepositoryError } from "@/domain/errors"
import { decodeInvoice } from "@/domain/bitcoin/lightning"
import { LedgerService } from "@/services/ledger"

export const PaymentStatusChecker = async (uncheckedPaymentRequest: string) => {
  const decodedInvoice = decodeInvoice(uncheckedPaymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { paymentHash, expiresAt, isExpired } = decodedInvoice

  return {
    paymentHash,
    expiresAt,
    isExpired,
    invoiceIsPaid: async (): Promise<boolean | RepositoryError> => {
      const ledger = LedgerService()
      const recorded = await ledger.isLnTxRecorded(paymentHash)
      if (recorded instanceof Error) return recorded
      return recorded
    },
  }
}
