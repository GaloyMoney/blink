type WalletInvoiceFactoryArgs = {
  registeredInvoice: RegisteredInvoice
  fiat: FiatAmount | null
}

type WalletInvoiceFactory = {
  createForSelf(args: WalletInvoiceFactoryArgs): WalletInvoice
  createForRecipient(args: WalletInvoiceFactoryArgs): WalletInvoice
}

type WalletInvoiceFactoryCreateMethod = (args: WalletInvoiceFactoryArgs) => WalletInvoice
