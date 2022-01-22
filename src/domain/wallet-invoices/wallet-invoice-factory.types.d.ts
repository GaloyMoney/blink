type WalletInvoiceFactory = {
  createForSelf(
    registeredInvoice: RegisteredInvoice,
  ): (fiat: FiatAmount | null) => WalletInvoice
  createForRecipient(
    registeredInvoice: RegisteredInvoice,
  ): (fiat: FiatAmount | null) => WalletInvoice
}

type WalletInvoiceFactoryCreateMethod = (
  registeredInvoice: RegisteredInvoice,
) => (fiat: FiatAmount | null) => WalletInvoice
