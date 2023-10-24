import { WalletInvoicesRepository } from "@/services/mongoose"

export const getInvoiceForWalletByPaymentHash = ({
  walletId,
  paymentHash,
}: {
  walletId: WalletId
  paymentHash: PaymentHash
}): Promise<WalletInvoice | ApplicationError> => {
  const walletInvoicesRepository = WalletInvoicesRepository()

  return walletInvoicesRepository.findForWalletByPaymentHash({
    walletId,
    paymentHash,
  })
}
