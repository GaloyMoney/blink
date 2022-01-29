type WalletInvoiceFactoryArgs = {
  registeredInvoice: RegisteredInvoice
  usdAmount: UsdAmount | undefined
}

type WalletInvoiceFactory = {
  createForSelf(args: WalletInvoiceFactoryArgs): WalletInvoice
  createForRecipient(args: WalletInvoiceFactoryArgs): WalletInvoice
}

type WalletInvoiceFactoryCreateMethod = (args: WalletInvoiceFactoryArgs) => WalletInvoice
