type WalletInvoiceFactoryArgs = {
  registeredInvoice: RegisteredInvoice
  fiatAmount: FiatAmount | undefined
}

type WalletInvoiceFactory = {
  createForSelf(args: WalletInvoiceFactoryArgs): WalletInvoice
  createForRecipient(args: WalletInvoiceFactoryArgs): WalletInvoice
}

type WalletInvoiceFactoryCreateMethod = (args: WalletInvoiceFactoryArgs) => WalletInvoice
