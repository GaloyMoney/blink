import { invoiceExpirationForCurrency } from "@/domain/bitcoin/lightning"
import { CouldNotFindWalletInvoiceError } from "@/domain/errors"
import { WalletCurrency } from "@/domain/shared"

export const WalletInvoiceChecker = (
  walletInvoice: WalletInvoiceWithOptionalLnInvoice | RepositoryError,
): WalletInvoiceChecker => {
  const shouldDecline = (): boolean => {
    if (walletInvoice instanceof CouldNotFindWalletInvoiceError) {
      return true
    }

    if (walletInvoice instanceof Error) {
      return false
    }

    const expiresAtWithDelay = invoiceExpirationForCurrency(
      walletInvoice.recipientWalletDescriptor.currency,
      walletInvoice.createdAt,
    )
    const isUsdRecipient =
      walletInvoice.recipientWalletDescriptor.currency === WalletCurrency.Usd
    if (isUsdRecipient && expiresAtWithDelay.getTime() < Date.now()) {
      return true
    }

    return false
  }

  return { shouldDecline }
}
