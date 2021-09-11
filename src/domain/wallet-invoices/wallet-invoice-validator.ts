import { AlreadyPaidError, SelfPaymentError } from "@domain/errors"

export const WalletInvoiceValidator = (
  walletInvoice: WalletInvoice,
): WalletInvoiceValidator => {
  const validateToSend = ({
    fromWalletId,
  }: {
    fromWalletId: WalletId
  }): void | ApplicationError => {
    if (walletInvoice.paid) return new AlreadyPaidError()

    if (walletInvoice.walletId === fromWalletId) return new SelfPaymentError()
  }

  return {
    validateToSend,
  }
}
