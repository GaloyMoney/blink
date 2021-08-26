import { RepositoryError } from "@domain/errors"
import { decodeInvoice } from "@domain/bitcoin/lightning"
import { WalletInvoicesRepository } from "@services/mongoose"

export const PaymentStatusChecker = ({ paymentRequest }) => {
  const decodedInvoice = decodeInvoice(paymentRequest)

  if (decodedInvoice instanceof Error) return decodedInvoice

  const { paymentHash } = decodedInvoice

  return {
    invoiceIsPaid: async (): Promise<boolean | RepositoryError> => {
      const repo = WalletInvoicesRepository()
      const walletInvoice = await repo.findByPaymentHash(paymentHash)
      if (walletInvoice instanceof RepositoryError) return walletInvoice
      return walletInvoice.paid
    },
  }
}
