import { WalletCurrency, ZERO_BANK_FEE } from "@domain/shared"

export const WalletInvoiceReceiver = async ({
  walletInvoice,
  receivedBtc,
  usdFromBtc,
  usdFromBtcMidPrice,
}: WalletInvoiceReceiverArgs): Promise<
  WalletInvoiceReceiver | DealerPriceServiceError | ValidationError
> => {
  const btcToCreditReceiver = receivedBtc

  if (walletInvoice.recipientWalletDescriptor.currency === WalletCurrency.Btc) {
    const usdToCreditReceiver = await usdFromBtcMidPrice(btcToCreditReceiver)
    if (usdToCreditReceiver instanceof Error) return usdToCreditReceiver

    return {
      btcToCreditReceiver,
      usdToCreditReceiver,
      ...ZERO_BANK_FEE,
      receivedAmount: () =>
        walletInvoice.recipientWalletDescriptor.currency === WalletCurrency.Btc
          ? btcToCreditReceiver
          : usdToCreditReceiver,
    }
  }

  if (walletInvoice.usdAmount) {
    const usdToCreditReceiver = walletInvoice.usdAmount
    return {
      btcToCreditReceiver,
      usdToCreditReceiver,
      ...ZERO_BANK_FEE,
      receivedAmount: () =>
        walletInvoice.recipientWalletDescriptor.currency === WalletCurrency.Btc
          ? btcToCreditReceiver
          : usdToCreditReceiver,
    }
  }

  const usdToCreditReceiver = await usdFromBtc(btcToCreditReceiver)
  if (usdToCreditReceiver instanceof Error) return usdToCreditReceiver

  return {
    usdToCreditReceiver,
    btcToCreditReceiver,
    ...ZERO_BANK_FEE,
    receivedAmount: () =>
      walletInvoice.recipientWalletDescriptor.currency === WalletCurrency.Btc
        ? btcToCreditReceiver
        : usdToCreditReceiver,
  }
}
