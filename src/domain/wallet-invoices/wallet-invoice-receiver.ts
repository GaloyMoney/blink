import { WalletCurrency, ZERO_CENTS, ZERO_SATS } from "@domain/shared"

export const WalletInvoiceReceiver = async ({
  walletInvoice,
  receivedBtc,
  usdFromBtc,
  usdFromBtcMidPrice,
}: WalletInvoiceReceiverArgs): Promise<
  WalletInvoiceReceiver | DealerPriceServiceError | ValidationError
> => {
  const zeroBankFee = {
    usdBankFee: ZERO_CENTS,
    btcBankFee: ZERO_SATS,
  }
  const btcToCreditReceiver = receivedBtc

  if (walletInvoice.recipientWalletDescriptor.currency === WalletCurrency.Btc) {
    const usdToCreditReceiver = await usdFromBtcMidPrice(btcToCreditReceiver)
    if (usdToCreditReceiver instanceof Error) return usdToCreditReceiver

    return {
      ...walletInvoice,
      btcToCreditReceiver,
      usdToCreditReceiver,
      recipientWalletDescriptor: walletInvoice.recipientWalletDescriptor,
      ...zeroBankFee,
      receivedAmount: () =>
        walletInvoice.recipientWalletDescriptor.currency === WalletCurrency.Btc
          ? btcToCreditReceiver
          : usdToCreditReceiver,
    }
  }

  if (walletInvoice.usdAmount) {
    const usdToCreditReceiver = walletInvoice.usdAmount
    return {
      ...walletInvoice,
      btcToCreditReceiver,
      usdToCreditReceiver,
      recipientWalletDescriptor: walletInvoice.recipientWalletDescriptor,
      ...zeroBankFee,
      receivedAmount: () =>
        walletInvoice.recipientWalletDescriptor.currency === WalletCurrency.Btc
          ? btcToCreditReceiver
          : usdToCreditReceiver,
    }
  }

  const usdToCreditReceiver = await usdFromBtc(btcToCreditReceiver)
  if (usdToCreditReceiver instanceof Error) return usdToCreditReceiver

  return {
    ...walletInvoice,
    usdToCreditReceiver,
    btcToCreditReceiver,
    recipientWalletDescriptor: walletInvoice.recipientWalletDescriptor,
    ...zeroBankFee,
    receivedAmount: () =>
      walletInvoice.recipientWalletDescriptor.currency === WalletCurrency.Btc
        ? btcToCreditReceiver
        : usdToCreditReceiver,
  }
}
