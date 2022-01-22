export const WalletInvoiceFactory = ({
  walletId,
  currency,
}: WalletFactoryArgs): WalletInvoiceFactory => {
  const createForSelf =
    (registeredInvoice: RegisteredInvoice) =>
    (fiat: FiatAmount | null): WalletInvoice => ({
      paymentHash: registeredInvoice.invoice.paymentHash,
      walletId,
      selfGenerated: true,
      pubkey: registeredInvoice.pubkey,
      paid: false,
      fiat,
      currency,
    })

  const createForRecipient =
    (registeredInvoice: RegisteredInvoice) =>
    (fiat: FiatAmount | null): WalletInvoice => ({
      paymentHash: registeredInvoice.invoice.paymentHash,
      walletId,
      selfGenerated: false,
      pubkey: registeredInvoice.pubkey,
      paid: false,
      fiat,
      currency,
    })

  return {
    createForSelf,
    createForRecipient,
  }
}
