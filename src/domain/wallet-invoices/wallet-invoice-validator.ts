import { AlreadyPaidError, SelfPaymentError } from "@domain/errors"

export const WalletInvoiceValidator = (
  walletInvoice: WalletInvoice,
): WalletInvoiceValidator => {
  const validateToSend = ({
    fromWalletId,
  }: {
    fromWalletId: WalletId
  }): true | ApplicationError => {
    if (walletInvoice.paid) return new AlreadyPaidError(walletInvoice.paymentHash)
    if (walletInvoice.uid === fromWalletId) return new SelfPaymentError()
    return true
  }

  return {
    validateToSend,
  }
}
