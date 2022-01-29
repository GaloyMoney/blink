export const WalletInvoiceFactory = ({
  walletId,
  currency,
}: WalletFactoryConfig): WalletInvoiceFactory => {
  const createForSelf = ({
    registeredInvoice,
    usdAmount,
  }: WalletInvoiceFactoryArgs): WalletInvoice => ({
    paymentHash: registeredInvoice.invoice.paymentHash,
    walletId,
    selfGenerated: true,
    pubkey: registeredInvoice.pubkey,
    paid: false,
    usdAmount,
    currency,
  })

  const createForRecipient = ({
    registeredInvoice,
    usdAmount,
  }: WalletInvoiceFactoryArgs): WalletInvoice => ({
    paymentHash: registeredInvoice.invoice.paymentHash,
    walletId,
    selfGenerated: false,
    pubkey: registeredInvoice.pubkey,
    paid: false,
    usdAmount,
    currency,
  })

  return {
    createForSelf,
    createForRecipient,
  }
}
