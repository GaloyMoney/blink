import { WalletInvoiceStatus } from "./index"

export const WalletInvoiceStatusChecker = (
  walletInvoice: WalletInvoice,
): WalletInvoiceStatusChecker => {
  const status = (currentTime: Date): WalletInvoiceStatus => {
    if (walletInvoice.paid) {
      return WalletInvoiceStatus.Paid
    }

    if (walletInvoice.lnInvoice.expiresAt < currentTime) {
      return WalletInvoiceStatus.Expired
    }

    return WalletInvoiceStatus.Pending
  }

  return {
    status,
  }
}
