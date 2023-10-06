import { CouldNotFindWalletInvoiceError } from "@/domain/errors"
import { WalletInvoicesRepository } from "@/services/mongoose"

export const getInvoiceForWalletByHash = async ({
  walletId,
  paymentHash,
}: {
  walletId: WalletId
  paymentHash: PaymentHash
}): Promise<WalletInvoice | ApplicationError> => {
  const walletInvoicesRepository = WalletInvoicesRepository()

  const walletInvoice = await walletInvoicesRepository.findByPaymentHash(paymentHash)

  if (walletInvoice instanceof Error) return walletInvoice

  if (walletInvoice.recipientWalletDescriptor.id !== walletId) {
    return new CouldNotFindWalletInvoiceError()
  }

  return walletInvoice
}
