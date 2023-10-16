import { decodeInvoice } from "@/domain/bitcoin/lightning"
import { CouldNotFindWalletInvoiceError } from "@/domain/errors"
import { ensureWalletInvoiceHasPaymentRequest } from "@/domain/wallet-invoices"
import { WalletInvoicesRepository } from "@/services/mongoose"

export const getInvoiceForWalletByPaymentHash = async ({
  walletId,
  paymentHash,
}: {
  walletId: WalletId
  paymentHash: PaymentHash
}): Promise<LnInvoice | ApplicationError> => {
  const walletInvoicesRepository = WalletInvoicesRepository()

  const walletInvoiceWithOptionalPaymentRequest =
    await walletInvoicesRepository.findByPaymentHash(paymentHash)

  if (walletInvoiceWithOptionalPaymentRequest instanceof Error)
    return walletInvoiceWithOptionalPaymentRequest

  if (walletInvoiceWithOptionalPaymentRequest.recipientWalletDescriptor.id !== walletId) {
    return new CouldNotFindWalletInvoiceError()
  }

  const walletInvoice = ensureWalletInvoiceHasPaymentRequest(
    walletInvoiceWithOptionalPaymentRequest,
  )

  if (walletInvoice instanceof Error) return walletInvoice

  const lnInvoice = decodeInvoice(walletInvoice.paymentRequest)

  return lnInvoice
}
