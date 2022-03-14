export const WalletInvoiceFactory = ({
  walletId,
  currency,
}: WalletFactoryConfig): WalletInvoiceFactory => {
  const createForSelf = ({
    registeredInvoice,
    cents,
    secret,
  }: WalletInvoiceFactoryArgs): WalletInvoice => ({
    paymentHash: registeredInvoice.invoice.paymentHash,
    secret,
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
    secret,
  }: WalletInvoiceFactoryArgs): WalletInvoice => ({
    paymentHash: registeredInvoice.invoice.paymentHash,
    secret,
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
