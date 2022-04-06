export const WalletInvoiceFactory = ({
  id,
  currency,
}: WalletDescriptor<WalletCurrency>): WalletInvoiceFactory => {
  const createForSelf = ({
    registeredInvoice,
    cents,
  }: WalletInvoiceFactoryArgs): WalletInvoice => ({
    paymentHash: registeredInvoice.invoice.paymentHash,
    walletId: id,
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
    walletId: id,
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
