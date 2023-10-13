import { WalletInvoiceMissingPaymentRequestError } from "./errors"

export * from "./wallet-invoice-checker"

export const ensureWalletInvoiceHasPaymentRequest = (
  walletInvoiceWithOptionalPaymentRequest: WalletInvoiceWithOptionalPaymentRequest,
): WalletInvoice | WalletInvoiceMissingPaymentRequestError => {
  if (!walletInvoiceWithOptionalPaymentRequest.paymentRequest) {
    return new WalletInvoiceMissingPaymentRequestError()
  }

  return walletInvoiceWithOptionalPaymentRequest as WalletInvoice
}
