export const WalletInvoiceFactory = ({
  walletId,
  currency,
}: WalletFactoryConfig): WalletInvoiceFactory => {
  const createForSelf = ({
    registeredInvoice,
    fiatAmount,
  }: WalletInvoiceFactoryArgs): WalletInvoice => ({
    paymentHash: registeredInvoice.invoice.paymentHash,
    walletId,
    selfGenerated: true,
    pubkey: registeredInvoice.pubkey,
    paid: false,
    fiatAmount,
    currency,
  })

  const createForRecipient = ({
    registeredInvoice,
    fiatAmount,
  }: WalletInvoiceFactoryArgs): WalletInvoice => ({
    paymentHash: registeredInvoice.invoice.paymentHash,
    walletId,
    selfGenerated: false,
    pubkey: registeredInvoice.pubkey,
    paid: false,
    fiatAmount,
    currency,
  })

  return {
    createForSelf,
    createForRecipient,
  }
}
