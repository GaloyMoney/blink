import { RepositoryError } from "@domain/errors"
import { decodeInvoice } from "@domain/bitcoin/lightning"
import { LedgerService } from "@services/ledger"

export const PaymentStatusChecker = async (uncheckedPaymentRequest: string) => {
  const decodedInvoice = decodeInvoice(uncheckedPaymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  // FLASH FORK DEBUGGING -----------------------------------------------
  console.log(
    "DEBUGGING: decodedInvoice for payment status checker",
    JSON.stringify(decodedInvoice, null, 2),
  )
  // FLASH FORK DEBUGGING -----------------------------------------------

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
