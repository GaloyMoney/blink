export const WalletInvoiceFactory = ({
  walletId,
  currency,
}: WalletFactoryConfig): WalletInvoiceFactory => {
  const createForSelf = ({
    registeredInvoice,
    cents,
  }: WalletInvoiceFactoryArgs): WalletInvoice => ({
    paymentHash: registeredInvoice.invoice.paymentHash,
    walletId,
    selfGenerated: true,
    pubkey: registeredInvoice.pubkey,
    paid: false,
    cents,
    currency,
  })

  const createForRecipient = ({
    registeredInvoice,
    cents,
  }: WalletInvoiceFactoryArgs): WalletInvoice => ({
    paymentHash: registeredInvoice.invoice.paymentHash,
    walletId,
    selfGenerated: false,
    pubkey: registeredInvoice.pubkey,
    paid: false,
    cents,
    currency,
  })

  return {
    createForSelf,
    createForRecipient,
  }
}
