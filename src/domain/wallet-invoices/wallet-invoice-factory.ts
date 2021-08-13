export const MakeWalletInvoiceFactory = (walletId: WalletId): IWalletInvoiceFactory => {
  const create = ({ registeredInvoice }): WalletInvoice => {
    return _baseCreate({ registeredInvoice, selfGenerated: true })
  }

  const createForRecipient = ({ registeredInvoice }): WalletInvoice => {
    return _baseCreate({
      registeredInvoice,
      selfGenerated: false,
    })
  }

  const _baseCreate = ({
    registeredInvoice: { invoice, pubkey },
    selfGenerated,
  }): WalletInvoice => {
    return {
      paymentHash: invoice.paymentHash,
      walletId,
      selfGenerated,
      pubkey,
      paid: false,
    }
  }

  return {
    create,
    createForRecipient,
  }
}
