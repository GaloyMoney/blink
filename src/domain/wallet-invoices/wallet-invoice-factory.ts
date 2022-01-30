export const WalletInvoiceFactory = ({
  walletId,
  currency,
}: WalletFactoryConfig): WalletInvoiceFactory => {
  const createForSelf = ({
    registeredInvoice,
    usdCents,
  }: WalletInvoiceFactoryArgs): WalletInvoice => ({
    paymentHash: registeredInvoice.invoice.paymentHash,
    walletId,
    selfGenerated: true,
    pubkey: registeredInvoice.pubkey,
    paid: false,
    usdCents,
    currency,
  })

  const createForRecipient = ({
    registeredInvoice,
    usdCents,
  }: WalletInvoiceFactoryArgs): WalletInvoice => ({
    paymentHash: registeredInvoice.invoice.paymentHash,
    walletId,
    selfGenerated: false,
    pubkey: registeredInvoice.pubkey,
    paid: false,
    usdCents,
    currency,
  })

  return {
    createForSelf,
    createForRecipient,
  }
}
