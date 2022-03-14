type WalletInvoiceFactoryArgs = {
  registeredInvoice: RegisteredInvoice
  cents: UsdCents | undefined
  secret: SecretPreImage
}

type WalletInvoiceFactory = {
  createForSelf(args: WalletInvoiceFactoryArgs): WalletInvoice
  createForRecipient(args: WalletInvoiceFactoryArgs): WalletInvoice
}

type WalletInvoiceFactoryCreateMethod = (args: WalletInvoiceFactoryArgs) => WalletInvoice
