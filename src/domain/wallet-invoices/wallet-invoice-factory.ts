export const WalletInvoiceFactory = ({
  walletId,
  currency,
  callback
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
    callback
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
    callback
  })

  return {
    createForSelf,
    createForRecipient,
  }
}
