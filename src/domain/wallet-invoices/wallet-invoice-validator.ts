import { AlreadyPaidError, SelfPaymentError } from "@domain/errors"

export const WalletInvoiceValidator = (
  walletInvoice: WalletInvoice,
): WalletInvoiceValidator => {
  const validateToSend = (fromWalletId: WalletId): true | ValidationError => {
    if (walletInvoice.paid) return new AlreadyPaidError(walletInvoice.paymentHash)
    if (walletInvoice.recipientWalletDescriptor.id === fromWalletId)
      return new SelfPaymentError()
    return true
  }

  return {
    validateToSend,
  }
}
