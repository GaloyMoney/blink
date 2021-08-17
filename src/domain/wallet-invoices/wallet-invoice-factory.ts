export const WalletInvoiceFactory = (walletId: WalletId): WalletInvoiceFactoryType => {
  const create = ({
    registeredInvoice,
  }: {
    registeredInvoice: RegisteredInvoice
  }): WalletInvoice => ({
    paymentHash: registeredInvoice.invoice.paymentHash,
    walletId,
    selfGenerated: true,
    pubkey: registeredInvoice.pubkey,
    paid: false,
  })

  const createForRecipient = ({
    registeredInvoice,
  }: {
    registeredInvoice: RegisteredInvoice
  }): WalletInvoice => ({
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
