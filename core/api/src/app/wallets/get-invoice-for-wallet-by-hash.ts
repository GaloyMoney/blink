import { CouldNotFindWalletInvoiceError } from "@domain/errors"
import { checkedToWalletId } from "@domain/wallets"
import { WalletInvoicesRepository } from "@services/mongoose"

export const getInvoiceForWalletByHash = async ({
  walletId: uncheckedWalletId,
  paymentHash,
}: {
  walletId: string
  paymentHash: PaymentHash
}) => {
  const walletId = checkedToWalletId(uncheckedWalletId)
  if (walletId instanceof Error) return walletId

  const walletInvoicesRepository = WalletInvoicesRepository()

  const walletInvoice = await walletInvoicesRepository.findByPaymentHash(paymentHash)

  if (walletInvoice instanceof Error) return walletInvoice

  // QUESTION: Should we make the walletId part of the repository method or do this check here?
  if (walletInvoice.recipientWalletDescriptor.id !== walletId) {
    return new CouldNotFindWalletInvoiceError()
  }

  return walletInvoice
}
