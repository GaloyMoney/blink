import { paymentAmountFromCents, WalletCurrency, ZERO_CENTS, ZERO_SATS } from "@domain/shared"

export const WalletInvoiceAmounts = async ({ 
  walletInvoice, 
  receivedBtc,
  usdFromBtc,
  usdFromBtcMidPrice, 
}: WalletInvoiceAmountsArgs): Promise<WalletInvoiceAmounts | DealerPriceServiceError> => {
  const zeroBankFee = {
    usdBankFee: ZERO_CENTS,
    btcBankFee: ZERO_SATS
  }
  const btcToCreditReceiver = receivedBtc
  const receiverWalletDescriptor = { id: walletInvoice.walletId, currency: walletInvoice.currency} as WalletDescriptor<WalletCurrency>
  
  if (walletInvoice.currency === WalletCurrency.Btc) {
    const usdToCreditReceiver = await usdFromBtcMidPrice(btcToCreditReceiver)
    if (usdToCreditReceiver instanceof Error) return usdToCreditReceiver
    
    return {
      ...walletInvoice,
      btcToCreditReceiver,
      usdToCreditReceiver,
      receiverWalletDescriptor,
      ...zeroBankFee
    }

  }

  if (walletInvoice.cents) {
    const usdToCreditReceiver = paymentAmountFromCents(walletInvoice.cents)
    
    return {
      ...walletInvoice,
      btcToCreditReceiver,
      usdToCreditReceiver,
      receiverWalletDescriptor,
      ...zeroBankFee
    }
  }

  const usdToCreditReceiver = await usdFromBtc(btcToCreditReceiver)
  if (usdToCreditReceiver instanceof Error) return usdToCreditReceiver

  return {
    ...walletInvoice,
    usdToCreditReceiver,
    btcToCreditReceiver,
    receiverWalletDescriptor,
    ...zeroBankFee
  }
}
