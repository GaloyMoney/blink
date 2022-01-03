export const WalletInvoiceFactory = (walletId: WalletId): WalletInvoiceFactory => {
  const create = (registeredInvoice: RegisteredInvoice): WalletInvoice => ({
    paymentHash: registeredInvoice.invoice.paymentHash,
    walletId,
    selfGenerated: true,
    pubkey: registeredInvoice.pubkey,
    paid: false,
  })

  const createForRecipient = (registeredInvoice: RegisteredInvoice): WalletInvoice => ({
    paymentHash: registeredInvoice.invoice.paymentHash,
    walletId,
    selfGenerated: false,
    pubkey: registeredInvoice.pubkey,
    paid: false,
  })

  return {
    create,
    createForRecipient,
  }
}
