type WalletInvoiceFactory = {
  create({ registeredInvoice: RegisteredInvoice }): WalletInvoice
  createForRecipient({ registeredInvoice: RegisteredInvoice }): WalletInvoice
}

type WalletInvoiceFactoryCreateMethod = ({
  registeredInvoice: RegisteredInvoice,
}) => WalletInvoice
